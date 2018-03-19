const algorithm = {
  getDateNow() {
    const date = localStorage.dateTimeNow ? new Date(localStorage.dateTimeNow) : new Date('2018/2/27')
    return date
  },
  getDateStart() {
    return new Date(this.getDateNow().toDateString())
  },
  getDateEnd() {
    return new Date(this.getDateStart().getTime() + 24 * 60 * 60 * 1000 - 1)
  },
  workBeginTime() {
    const day = this.getDateNow().getDay()
    let time
    if (day > 0 && day < 6) {
      time = parseInt(localStorage.workBeginTime)
    } else {
      time = parseInt(localStorage.weekendBeginTime)
    }
    return new Date(this.getDateStart().getTime() + time * 60 * 60 * 1000)
  },
  workEndTime() {
    const day = this.getDateNow().getDay()
    let time
    if (day > 0 && day < 6) {
      time = parseInt(localStorage.workEndTime)
    } else {
      time = parseInt(localStorage.weekendEndTime)
    }
    return new Date(this.getDateStart().getTime() + time * 60 * 60 * 1000)
  },
  assign({ technicianList, orderList, level, preAssignList, workListObj, historyPreAssignList }) {
    historyPreAssignList = historyPreAssignList || {}
    historyPreAssignList[level] = preAssignList
    // if (level > 1) return { state: 'fail' }
    for (let orderItem of orderList) {
      const r = this.assignOrder({
        technicianList,
        orderList,
        orderItem,
        level,
        preAssignList,
        workListObj,
        historyPreAssignList
      })
      if (r.state == 'continue') {
        continue
      } else if (r.state == 'fail') {
        return r
      } else if (r.state == 'complete') {
        return r
      }
    }
    console.log({ assign: 'assign', preAssignList })
    return { preAssignList, state: 'complete', historyPreAssignList }
  },
  assignOrder({ technicianList, orderList, orderItem, level, preAssignList, workListObj, historyPreAssignList }) {
    const priorityTime = localStorage.priorityTime
    orderItem.orderInfo.sort((x, y) => x.kind.priority - y.kind.priority)
    const projectQueue = []
    const orderMatchPreAssignList = preAssignList.filter((x) => x.orderID == orderItem.id)
    let prevProjectEndTime = new Date(0)
    if (orderMatchPreAssignList.length) {
      prevProjectEndTime = Math.max(...orderMatchPreAssignList.map((x) => x.timeEnd))
    }
    const notAssignProject = orderItem.orderInfo.filter((projectItem) => {
      return !preAssignList.find((x) => x.orderID == orderItem.id && x.projectID == projectItem.project.id)
    })
    notAssignProject.forEach((projectItem, i) => {
      const projectPriorityTime = i * priorityTime
      const technicianMatchList = this.findTechnician({ projectItem, technicianList, projectPriorityTime })
      projectQueue.push(...technicianMatchList)
    })
    const TechnicianTimeList = this.getTechnicianTimeList({
      prevProjectEndTime,
      orderItem,
      projectQueue,
      workListObj,
      preAssignList
    })
    // console.log(orderItem.name, TechnicianTimeList)

    for (let TechnicianTimeItem of TechnicianTimeList) {
      console.log({
        technicianName: TechnicianTimeItem.technicianItem.technician.name,
        orderName: orderItem.name,
        projectName: TechnicianTimeItem.projectItem.project.name,
        timeStart: TechnicianTimeItem.timeStart
      })
      if (orderMatchPreAssignList.find((x) => x.projectID == TechnicianTimeItem.projectItem.project.id)) {
        console.log(orderMatchPreAssignList, TechnicianTimeItem.projectItem.project)
        console.log(1)
        continue
      }
      if (!TechnicianTimeItem.last) {
        if (TechnicianTimeItem.next.isAdjust) {
          const endTime = TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000
          const nextStartTime = TechnicianTimeItem.next.timeStart.getTime()
          if (nextStartTime >= endTime) {
            if (this.assignItem({ orderItem, TechnicianTimeItem, level, preAssignList, historyPreAssignList })) {
              console.log(2)
              return this.assignOrder({
                orderList,
                technicianList,
                orderItem,
                level,
                preAssignList,
                workListObj,
                historyPreAssignList
              })
            } else {
              console.log(3)
              return { state: 'fail' }
            }
          } else {
            console.log(4)
            continue
          }
        }
        const newPreAssignList = this.reAssign({ orderItem, TechnicianTimeItem, level, preAssignList })
        if (!newPreAssignList) {
          console.log(5)
          continue
        }
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: newPreAssignList,
          workListObj,
          historyPreAssignList
        })
        console.log({ r })
        if (r.state == 'fail') {
          console.log(6)
          continue
        } else {
          console.log(7)
          return r
        }
      }
      if (this.assignItem({ orderItem, TechnicianTimeItem, level, preAssignList, historyPreAssignList })) {
        console.log(8)
        return this.assignOrder({
          orderList,
          technicianList,
          orderItem,
          level,
          preAssignList,
          workListObj,
          historyPreAssignList
        })
      } else {
        console.log(9)
        return { state: 'fail' }
      }
    }
    return { state: 'continue' }
  },
  reAssign({ orderItem, TechnicianTimeItem, level, preAssignList }) {
    console.log('reAssign')
    // if (TechnicianTimeItem.next.orderName == 'b') {
    //   debugger
    // }
    const newPreAssignList = []
    let findNext = false
    for (let item of preAssignList) {
      if (item.orderID == TechnicianTimeItem.next.orderID && item.projectID == TechnicianTimeItem.next.projectID) {
        findNext = true
      }
      if (
        item.technicianID == TechnicianTimeItem.technicianItem.technician.id &&
        item.timeEnd.getTime() > TechnicianTimeItem.timeStart.getTime() &&
        item.timeStart.getTime() < TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000
      ) {
        if (item.isAdjust) {
          console.log('reAssign isAdjust return false')
          return false
        }
        continue
      }
      if (!findNext) {
        newPreAssignList.push(item)
      }
    }
    console.log({ newPreAssignList, preAssignList, orderItem, TechnicianTimeItem })
    const preAssignListItem = {
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectName: TechnicianTimeItem.projectItem.project.name,
      technicianID: TechnicianTimeItem.technicianItem.technician.id,
      orderID: orderItem.id,
      projectID: TechnicianTimeItem.projectItem.project.id,
      timeStart: TechnicianTimeItem.timeStart,
      duration: TechnicianTimeItem.duration,
      timeEnd: new Date(TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000)
    }
    newPreAssignList.push(preAssignListItem)
    return newPreAssignList
  },
  assignItem({ orderItem, TechnicianTimeItem, level, preAssignList, historyPreAssignList }) {
    for (let i = 1; i < level; i++) {
      const item = historyPreAssignList[i].find(
        (x) => x.orderID == orderItem.id && x.projectID == TechnicianTimeItem.projectItem.project.id
      )
      const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
      if (item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > delayTime) {
        // console.log(TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime())
        return false
      }
    }
    preAssignList.push({
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectName: TechnicianTimeItem.projectItem.project.name,
      technicianID: TechnicianTimeItem.technicianItem.technician.id,
      orderID: orderItem.id,
      projectID: TechnicianTimeItem.projectItem.project.id,
      timeStart: TechnicianTimeItem.timeStart,
      duration: TechnicianTimeItem.duration,
      timeEnd: new Date(TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000)
    })
    return true
  },
  getTechnicianTimeList({ prevProjectEndTime, orderItem, projectQueue, workListObj, preAssignList }) {
    if (projectQueue.length <= 0) {
      return []
    }
    if (orderItem.name == 'j') {
      console.log('----------------------------------------------------------------')
      console.log({ projectQueue })
    } else {
      console.log({ orderItem, projectQueue })
    }
    const technicianTimeList = []
    let timeStart = new Date(
      Math.max(...[prevProjectEndTime, this.getDateNow(), orderItem.preorderTime, this.workBeginTime()])
    )
    for (let projectQueueItem of projectQueue) {
      const technicianAssignList = preAssignList
        .filter((item) => item.technicianID == projectQueueItem.technicianItem.technician.id)
        .sort((x, y) => x.timeStart - y.timeStart)
      let lastTime = timeStart
      let lastTimeRelative = null
      technicianAssignList.forEach((item) => {
        if (lastTime < item.timeStart) {
          if (timeStart <= lastTime) {
            technicianTimeList.push({
              ...projectQueueItem,
              timeStart: new Date(lastTime),
              last: false,
              next: item
            })
          } else if (timeStart < item.timeStart && timeStart > lastTime) {
            technicianTimeList.push({ ...projectQueueItem, timeStart: new Date(timeStart), last: false, next: item })
          }
        }
        if (item.timeEnd <= timeStart) {
          lastTimeRelative = item.timeEnd
        }
        lastTime = item.timeEnd
        // console.log(projectQueueItem.technicianItem.technician.name, lastTime)
      })

      if (lastTimeRelative) {
        // console.log(projectQueueItem.technicianItem.technician.name, lastTime, timeStart)
        projectQueueItem.technicianItem.lastWorkTime = lastTimeRelative
      }
      technicianTimeList.push({
        ...projectQueueItem,
        timeStart: new Date(Math.max(...[lastTime, timeStart])),
        last: true
      })
    }
    console.log('technicianTimeList')
    console.log(
      technicianTimeList.sort((a, b) => {
        const timeDif =
          a.timeStart.getTime() + a.delayTime * 60 * 1000 - b.timeStart.getTime() - b.delayTime * 60 * 1000
        if (timeDif == 0) {
          const lastWorkTimeA = a.technicianItem.lastWorkTime ? a.technicianItem.lastWorkTime.getTime() : 0
          const lastWorkTimeB = b.technicianItem.lastWorkTime ? b.technicianItem.lastWorkTime.getTime() : 0
          // console.log(lastWorkTimeA, lastWorkTimeB)
          // console.log(lastWorkTimeA - lastWorkTimeB)
          return lastWorkTimeA - lastWorkTimeB
        }
        return timeDif
      })
    )
    return technicianTimeList.sort((a, b) => {
      const timeDif = a.timeStart.getTime() + a.delayTime * 60 * 1000 - b.timeStart.getTime() - b.delayTime * 60 * 1000
      if (timeDif == 0) {
        const lastWorkTimeA = a.technicianItem.lastWorkTime ? a.technicianItem.lastWorkTime.getTime() : 0
        const lastWorkTimeB = b.technicianItem.lastWorkTime ? b.technicianItem.lastWorkTime.getTime() : 0
        // console.log(lastWorkTimeA, lastWorkTimeB)
        // console.log(lastWorkTimeA - lastWorkTimeB)
        return lastWorkTimeA - lastWorkTimeB
      }
      return timeDif
    })
  },
  findTechnician({ projectItem, technicianList, projectPriorityTime }) {
    const technicianMatchList = []
    let technicianListFilter = technicianList
    if (projectItem.technicians.length > 0) {
      technicianListFilter = technicianList.filter((technicianItem) => {
        return projectItem.technicians.find((i) => i.id == technicianItem.technician.id)
      })
      technicianListFilter.forEach((technicianItem) => {
        const projectSkill = technicianItem.technician.skillInfo[projectItem.project.id]
        let duration = projectSkill && projectSkill.time ? projectSkill.time : 0
        for (let add of projectItem.additions) {
          if (technicianItem.technician.skillInfo[add.id] && technicianItem.technician.skillInfo[add.id].time) {
            duration += technicianItem.technician.skillInfo[add.id].time
          }
        }
        duration = duration || 45
        technicianMatchList.push({
          type: 'major',
          technicianItem,
          delayTime: 0,
          projectItem,
          duration
        })
      })
      return technicianMatchList
    }
    technicianListFilter.forEach((technicianItem) => {
      let typeList = []
      if (technicianItem.technician.skillInfo[projectItem.project.id]) {
        let duration = technicianItem.technician.skillInfo[projectItem.project.id].time || 0
        console.log({ duration, projectid: projectItem.project.id, p: technicianItem.technician })
        let matchResult = true
        let addDuration = 0
        typeList.push(technicianItem.technician.skillInfo[projectItem.project.id].type)
        for (let add of projectItem.additions) {
          if (!technicianItem.technician.skillInfo[add.id]) {
            matchResult = false
          } else {
            addDuration += technicianItem.technician.skillInfo[add.id].time || 0
            typeList.push(technicianItem.technician.skillInfo[add.id].type)
          }
        }
        if (matchResult) {
          let delayTime = 0
          let type = 'major'
          if (typeList.find((i) => i == 'sub')) {
            delayTime = parseInt(localStorage.subTime)
            type = 'sub'
          } else if (typeList.find((i) => i == 'minor')) {
            delayTime = parseInt(localStorage.minorTime)
            type = 'minor'
          }
          delayTime += projectPriorityTime
          duration = duration + addDuration || 45
          console.log({ duration, addDuration })
          technicianMatchList.push({ type, technicianItem, delayTime, projectItem, duration })
        }
      }
    })
    return technicianMatchList
  }
}
function init(Vue) {
  Object.defineProperty(Vue.prototype, '$clone', {
    get() {
      return (obj) => {
        return JSON.parse(JSON.stringify(obj), (k, v) => {
          if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
            return new Date(v)
          }
          return v
        })
      }
    }
  })

  Object.defineProperty(Vue.prototype, '$getNewID', {
    get() {
      const pn = performance.now()
      const time = new Date().getTime()
      const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(0, 3)
      const timeStr = `${time}${pnStr}`
      return parseInt(timeStr)
    }
  })

  Object.defineProperty(Vue.prototype, '$algorithm', {
    get() {
      return algorithm
    }
  })
}
export default {
  install(Vue, options) {
    init(Vue)
  }
}
