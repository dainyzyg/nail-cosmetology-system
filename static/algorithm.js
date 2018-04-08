window.algorithm = {
  timeDuration: 0,
  getDateNow() {
    const date = localStorage.dateTimeNow ? new Date(localStorage.dateTimeNow) : new Date('2018/2/27')
    return new Date(date.getTime() + this.timeDuration)
  },
  getDateStart() {
    return new Date(this.getDateNow().toDateString())
  },
  getDateEnd() {
    return new Date(this.getDateStart().getTime() + 24 * 60 * 60 * 1000 - 1)
  },
  openWindow(screenName) {
    console.log('openWindow')
    const BrowserWindow = require('electron').remote.BrowserWindow
    let win = new BrowserWindow({ width: 800, height: 600 })
    win.on('closed', () => {
      win = null
    })
    // win.webContents.toggleDevTools()
    // 加载远程URL
    win.loadURL(`atom://atom/static/${screenName}.html`)
    // win.loadURL('http://localhost:8080')
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
  assign({ technicianList, orderList, level, preAssignList, workListObj, historyPreAssignList, doDelayProjectList }) {
    historyPreAssignList = historyPreAssignList || {}
    historyPreAssignList[level] = preAssignList
    doDelayProjectList = doDelayProjectList || []
    // if (level > 1) return { state: 'fail' }
    for (let orderItem of orderList) {
      const r = this.assignOrder({
        technicianList,
        orderList,
        orderItem,
        level,
        preAssignList,
        workListObj,
        historyPreAssignList,
        doDelayProjectList: [...doDelayProjectList]
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
  assignOrder({
    technicianList,
    orderList,
    orderItem,
    level,
    preAssignList,
    workListObj,
    historyPreAssignList,
    doDelayProjectList
  }) {
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
      if (TechnicianTimeItem.jump) {
        // 必做插队
        let oldDoDelayProjectList = doDelayProjectList || []
        let newDoDelayProjectList = TechnicianTimeItem.doDelayProjectList || []
        newDoDelayProjectList = [...oldDoDelayProjectList, ...newDoDelayProjectList]
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: TechnicianTimeItem.preAssignList,
          doDelayProjectList: newDoDelayProjectList,
          workListObj,
          historyPreAssignList
        })
        if (r.state == 'fail') {
          continue
        } else {
          return r
        }
      }
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
        // 判断能否插在必做项目的前面
        if (TechnicianTimeItem.next.projectItem.project.do) {
          const isDoDelay = doDelayProjectList.find(
            (x) => x.projectID == TechnicianTimeItem.projectItem.project.id && x.orderID == orderItem.id
          )
          const endTime = TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000
          const nextStartTime = TechnicianTimeItem.next.timeStart.getTime()
          if (isDoDelay && nextStartTime < endTime) {
            continue
          }
          // const mustDoneAdvanceTime = parseInt(localStorage.mustDoneAdvanceTime)
          // let earliestOrderTimeTemp = new Date(Math.max(prevProjectEndTime, orderItem.preorderTime))
          // if (TechnicianTimeItem.projectItem.project.do) {
          //   earliestOrderTimeTemp = new Date(earliestOrderTimeTemp.getTime() - mustDoneAdvanceTime * 60 * 1000)
          // }
          // if (TechnicianTimeItem.next.earliestOrderTime <= earliestOrderTimeTemp) {
          //   continue
          // }
        }
        if (TechnicianTimeItem.next.isAdjust) {
          const endTime = TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000
          const nextStartTime = TechnicianTimeItem.next.timeStart.getTime()
          if (nextStartTime >= endTime) {
            const assignItemResult = this.assignItem({
              prevProjectEndTime,
              orderItem,
              TechnicianTimeItem,
              level,
              preAssignList,
              historyPreAssignList,
              doDelayProjectList
            })
            if (assignItemResult.state == 'complete') {
              console.log(2)
              return this.assignOrder({
                orderList,
                technicianList,
                orderItem,
                level,
                preAssignList,
                workListObj,
                doDelayProjectList: [...doDelayProjectList],
                historyPreAssignList
              })
            } else if (assignItemResult.state == 'fail') {
              console.log(3)
              return { state: 'fail' }
            } else {
              const r = this.assign({
                technicianList,
                orderList,
                level: level + 1,
                preAssignList: assignItemResult.preAssignList,
                workListObj,
                doDelayProjectList: [...doDelayProjectList],
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
          } else {
            console.log(4)
            continue
          }
        }
        const newPreAssignList = this.reAssign({
          prevProjectEndTime,
          orderItem,
          TechnicianTimeItem,
          level,
          preAssignList
        })
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
          doDelayProjectList: [...doDelayProjectList],
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
      const assignItemResult = this.assignItem({
        prevProjectEndTime,
        orderItem,
        TechnicianTimeItem,
        level,
        preAssignList,
        historyPreAssignList,
        doDelayProjectList
      })
      if (assignItemResult.state == 'complete') {
        console.log(8)
        return this.assignOrder({
          orderList,
          technicianList,
          orderItem,
          level,
          preAssignList,
          workListObj,
          doDelayProjectList: [...doDelayProjectList],
          historyPreAssignList
        })
      } else if (assignItemResult.state == 'fail') {
        console.log(9)
        return { state: 'fail' }
      } else {
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: assignItemResult.preAssignList,
          workListObj,
          doDelayProjectList: [...doDelayProjectList],
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
    }
    return { state: 'continue' }
  },
  reAssign({ prevProjectEndTime, orderItem, TechnicianTimeItem, level, preAssignList }) {
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
      earliestOrderTime: new Date(Math.max(orderItem.preorderTime, prevProjectEndTime)),
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectItem: TechnicianTimeItem.projectItem,
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
  assignItem({
    prevProjectEndTime,
    orderItem,
    TechnicianTimeItem,
    level,
    preAssignList,
    historyPreAssignList,
    doDelayProjectList
  }) {
    for (let i = 1; i < level; i++) {
      const item = historyPreAssignList[i].find(
        (x) => x.orderID == orderItem.id && x.projectID == TechnicianTimeItem.projectItem.project.id
      )
      const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
      if (item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > delayTime) {
        // console.log(TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime())
        return { state: 'fail' }
      }

      const isDoDelay = doDelayProjectList.find((x) => x.projectID == item.projectID && x.orderID == item.orderID)
      const mustDoneDelayTime = parseInt(localStorage.mustDoneDelayTime) * 60 * 1000
      if (isDoDelay && item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > mustDoneDelayTime) {
        // console.log(TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime())
        return { state: 'fail' }
      }
    }
    const assignItem = {
      earliestOrderTime: new Date(Math.max(orderItem.preorderTime, prevProjectEndTime)),
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectItem: TechnicianTimeItem.projectItem,
      projectName: TechnicianTimeItem.projectItem.project.name,
      technicianID: TechnicianTimeItem.technicianItem.technician.id,
      orderID: orderItem.id,
      projectID: TechnicianTimeItem.projectItem.project.id,
      timeStart: TechnicianTimeItem.timeStart,
      duration: TechnicianTimeItem.duration,
      timeEnd: new Date(TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000)
    }
    let reAssignItem = null
    const newPreAssignList = []
    for (let p of preAssignList) {
      if (
        !p.isAdjust &&
        p.projectID == assignItem.projectID &&
        p.timeStart > assignItem.timeStart &&
        p.earliestOrderTime < assignItem.earliestOrderTime
      ) {
        // 判断即技师能是否匹配，能否互换
        // 项目一样 附加一样   将数组排序然后转换成字符串
        const pAdditionsStr = JSON.stringify(p.projectItem.additions.map((m) => m.id).sort((a, b) => a - b))
        const assignItemAdditionsStr = JSON.stringify(
          assignItem.projectItem.additions.map((m) => m.id).sort((a, b) => a - b)
        )
        if (pAdditionsStr == assignItemAdditionsStr) {
          reAssignItem = p
          break
        }
      }
      newPreAssignList.push(p)
    }

    if (reAssignItem) {
      assignItem.technicianName = reAssignItem.technicianName
      assignItem.technicianID = reAssignItem.technicianID
      assignItem.timeStart = reAssignItem.timeStart
      assignItem.timeEnd = reAssignItem.timeEnd
      assignItem.duration = reAssignItem.duration
      newPreAssignList.push(assignItem)
      return {
        state: 'reassign',
        preAssignList: newPreAssignList
      }
    }
    preAssignList.push(assignItem)
    return { state: 'complete' }
  },
  getDoProjectJumpList({ prevProjectEndTime, orderItem, projectQueueItem, technicianAssignList, preAssignList }) {
    // debugger
    // const mustDoneAdvanceTime = parseInt(localStorage.mustDoneAdvanceTime)
    const trueOrderTime = new Date(Math.max(prevProjectEndTime, orderItem.preorderTime, this.getDateNow()))
    const earliestOrderTime = new Date(Math.max(prevProjectEndTime, orderItem.preorderTime))
    const list = technicianAssignList.filter(
      (item) => !item.isAdjust && !item.projectItem.project.do && item.timeEnd > trueOrderTime
    )
    const DoProjectJumpList = []
    list.forEach((item) => {
      const newPreAssignList = []
      const doDelayProjectList = [{ orderID: item.orderID, projectID: item.projectID }]
      let timeStart = new Date(0)
      let lastTimeRelative = new Date(0) // 排除小项的上个项目完成时间，用来排序
      for (let assignItem of preAssignList) {
        if (assignItem == item) {
          break
        }
        if (
          assignItem.technicianID == projectQueueItem.technicianItem.technician.id &&
          assignItem.timeEnd > timeStart
        ) {
          timeStart = assignItem.timeEnd
        }
        if (
          assignItem.technicianID == projectQueueItem.technicianItem.technician.id &&
          assignItem.timeEnd > lastTimeRelative &&
          (!item.projectItem || item.projectItem.kind.orderRule != '由后到前')
        ) {
          lastTimeRelative = item.timeEnd
        }
        newPreAssignList.push(assignItem)
      }
      timeStart = new Date(Math.max(timeStart, trueOrderTime, this.getDateNow(), this.workBeginTime()))
      const jumpAssignItem = {
        earliestOrderTime,
        date: this.getDateStart(),
        state: 'unstart',
        technicianName: projectQueueItem.technicianItem.technician.name,
        orderName: orderItem.name,
        projectItem: projectQueueItem.projectItem,
        projectName: projectQueueItem.projectItem.project.name,
        technicianID: projectQueueItem.technicianItem.technician.id,
        orderID: orderItem.id,
        projectID: projectQueueItem.projectItem.project.id,
        timeStart,
        duration: projectQueueItem.duration,
        timeEnd: new Date(timeStart.getTime() + projectQueueItem.duration * 60 * 1000)
      }
      newPreAssignList.push(jumpAssignItem)
      DoProjectJumpList.push({
        doDelayProjectList,
        lastTimeRelative,
        ...projectQueueItem,
        timeStart,
        preAssignList: newPreAssignList,
        jump: true
      })
    })
    return DoProjectJumpList
  },
  getTechnicianTimeList({ prevProjectEndTime, orderItem, projectQueue, workListObj, preAssignList }) {
    if (projectQueue.length <= 0) {
      return []
    }

    const technicianTimeList = []
    let timeStart = new Date(
      Math.max(...[prevProjectEndTime, this.getDateNow(), orderItem.preorderTime, this.workBeginTime()])
    )
    for (let projectQueueItem of projectQueue) {
      const technicianAssignList = preAssignList
        .filter((item) => item.technicianID == projectQueueItem.technicianItem.technician.id)
        .sort((x, y) => x.timeStart - y.timeStart)
      if (projectQueueItem.projectItem.project.do) {
        // 必做项目
        const DoProjectJumpList = this.getDoProjectJumpList({
          projectQueueItem,
          orderItem,
          prevProjectEndTime,
          technicianAssignList,
          preAssignList
        })
        technicianTimeList.push(...DoProjectJumpList)
      }
      let lastTime = timeStart
      let lastTimeRelative = new Date(0) // 排除小项的上个项目完成时间，用来排序
      technicianAssignList.forEach((item) => {
        if (lastTime < item.timeStart) {
          if (timeStart <= lastTime) {
            technicianTimeList.push({
              lastTimeRelative,
              ...projectQueueItem,
              timeStart: new Date(lastTime),
              last: false,
              next: item
            })
          } else if (timeStart < item.timeStart && timeStart > lastTime) {
            technicianTimeList.push({
              lastTimeRelative,
              ...projectQueueItem,
              timeStart: new Date(timeStart),
              last: false,
              next: item
            })
          }
        }
        // if (item.timeEnd <= timeStart) {
        //   lastTimeRelative = item.timeEnd
        // }
        if (!item.projectItem || item.projectItem.kind.orderRule != '由后到前') {
          lastTimeRelative = item.timeEnd
        }
        lastTime = item.timeEnd
        // console.log(projectQueueItem.technicianItem.technician.name, lastTime)
      })

      // if (lastTimeRelative) {
      //   // console.log(projectQueueItem.technicianItem.technician.name, lastTime, timeStart)
      //   projectQueueItem.technicianItem.lastWorkTime = lastTimeRelative
      // }
      technicianTimeList.push({
        lastTimeRelative,
        ...projectQueueItem,
        timeStart: new Date(Math.max(...[lastTime, timeStart])),
        last: true
      })
    }

    return technicianTimeList.sort((a, b) => {
      const timeDif = a.timeStart.getTime() + a.delayTime * 60 * 1000 - b.timeStart.getTime() - b.delayTime * 60 * 1000
      if (timeDif == 0) {
        return a.lastTimeRelative - b.lastTimeRelative
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
        let duration = projectSkill && projectSkill.timeDiff ? projectSkill.timeDiff : 0
        for (let add of projectItem.additions) {
          if (technicianItem.technician.skillInfo[add.id] && technicianItem.technician.skillInfo[add.id].timeDiff) {
            duration += technicianItem.technician.skillInfo[add.id].timeDiff
          }
        }
        // duration = duration || 45
        technicianMatchList.push({
          type: 'major',
          technicianItem,
          delayTime: 0,
          projectItem,
          duration: projectItem.standardTimeAll + duration
        })
      })
      return technicianMatchList
    }
    technicianListFilter.forEach((technicianItem) => {
      let typeList = []
      if (
        technicianItem.technician.skillInfo[projectItem.project.id] &&
        technicianItem.technician.skillInfo[projectItem.project.id].type
      ) {
        let duration = technicianItem.technician.skillInfo[projectItem.project.id].timeDiff || 0
        console.log({ duration, projectid: projectItem.project.id, p: technicianItem.technician })
        let matchResult = true
        let addDuration = 0
        typeList.push(technicianItem.technician.skillInfo[projectItem.project.id].type)
        for (let add of projectItem.additions) {
          if (!technicianItem.technician.skillInfo[add.id]) {
            matchResult = false
          } else {
            addDuration += technicianItem.technician.skillInfo[add.id].timeDiff || 0
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
          duration = duration + addDuration + projectItem.standardTimeAll
          console.log({ duration, addDuration })
          technicianMatchList.push({ type, technicianItem, delayTime, projectItem, duration })
        }
      }
    })
    return technicianMatchList
  },
  init(Vue) {
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
        return window.algorithm
      }
    })
  }
}

setInterval(() => {
  window.algorithm.timeDuration += 10000
}, 10000)
// export default {
//   install(Vue, options) {
//     init(Vue)
//   }
// }
