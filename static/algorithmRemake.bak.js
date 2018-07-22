const { ipcRenderer } = require('electron')
ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"
})
window.ipcRenderer = ipcRenderer
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
  openWindow(screenName, config = { width: 800, height: 600 }) {
    console.log('openWindow')
    const BrowserWindow = require('electron').remote.BrowserWindow
    let win = new BrowserWindow(config)
    win.on('closed', () => {
      win = null
    })
    win.webContents.toggleDevTools()
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
  async getTechnicianList() {
    const attendanceInfo = {}
    const technicianList = []
    const dateBegin = this.getDateStart()
    await window.IDB.executeTransaction(['attendance', 'technician'], 'readonly', (t) => {
      const store = t.objectStore('attendance')
      const request = store.index('date').openCursor(IDBKeyRange.only(dateBegin))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.isAttend) {
            attendanceInfo[cursor.value.id] = cursor.value
            const getTechnicianRequest = t.objectStore('technician').get(cursor.value.id)
            getTechnicianRequest.onsuccess = (e) => {
              if (e.target.result) {
                e.target.result.attendanceInfo = cursor.value
                technicianList.push(e.target.result)
              }
            }
          }
          cursor.continue()
        }
      }
    })
    return technicianList.sort((a, b) => a.index - b.index)
  },
  async initWorkingTableLimit() {
    window.workingTableLimitObject = {}
    await window.IDB.executeTransaction(['kind'], 'readonly', (t) => {
      const store = t.objectStore('kind')
      const request = store.openCursor()
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.workingTableLimit) {
            window.workingTableLimitObject[cursor.value.id] = Number(cursor.value.workingTableLimitNumber)
          }
          cursor.continue()
        }
      }
    })
  },
  async getOrder() {
    const orderList = []
    const dateBegin = this.getDateStart()
    const dateEnd = this.getDateEnd()
    await window.IDB.executeTransaction(['order'], 'readonly', (t) => {
      const store = t.objectStore('order')
      const request = store.index('preorderTime').openCursor(IDBKeyRange.bound(dateBegin, dateEnd))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          orderList.push(cursor.value)
          if (cursor.value.otherFormDatas) {
            orderList.push(
              ...cursor.value.otherFormDatas.map((o) =>
                Object.assign(o, {
                  orderDate: cursor.value.orderDate,
                  isPreorder: cursor.value.isPreorder,
                  preorderTime: cursor.value.preorderTime,
                  id: o.tabID
                })
              )
            )
          }
          cursor.continue()
        }
      }
    })
    orderList.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime())
    return orderList
  },

  async getAssignList() {
    const dateBegin = this.getDateStart()
    const assignList = await window.IDB.get('assignList', dateBegin)
    return assignList
  },
  async getAssignedList() {
    const assignedList = []
    const dateBegin = this.getDateStart()
    await window.IDB.executeTransaction(['assign'], 'readonly', (t) => {
      const store = t.objectStore('assign')
      const request = store.index('date').openCursor(IDBKeyRange.only(dateBegin))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          assignedList.push(cursor.value)
          cursor.continue()
        }
      }
    })
    return assignedList
  },
  async assignpProjects() {
    console.time('assignpProjects')
    await this.initWorkingTableLimit()
    const technicianList = await this.getTechnicianList()
    console.log({ technicianList })
    const orderList = await this.getOrder()
    console.log({ orderList })
    const assignedList = await this.getAssignedList()

    const r = this.assign({
      technicianList,
      orderList,
      assignedList
    })
    console.log({ r })
    // const assignList = {
    //   preAssignList: this.counts(r.preAssignList),
    //   technicianList,
    //   historyPreAssignList: r.historyPreAssignList,
    //   date: this.getDateStart(),
    //   dateNow: this.getDateNow(),
    //   historyLevel: r.historyLevel
    // }
    // await window.IDB.put('assignList', assignList)
    // ipcRenderer.send('asynchronous-message', preAssignList)
    console.timeEnd('assignpProjects')
  },
  findTechnician({ projectItem, technicianList, projectPriorityTime }) {
    const technicianMatchList = []
    let technicianListFilter = technicianList
    if (projectItem.technicians.length > 0) {
      technicianListFilter = technicianList.filter((technicianItem) => {
        return projectItem.technicians.find((i) => i.id == technicianItem.id)
      })
      technicianListFilter.forEach((technicianItem) => {
        technicianMatchList.push({
          type: 'major',
          technicianItem,
          delayTime: 0,
          projectItem
        })
      })
      return technicianMatchList
    }
    technicianListFilter.forEach((technicianItem) => {
      let typeList = []
      if (technicianItem.skillInfo[projectItem.project.id] && technicianItem.skillInfo[projectItem.project.id].type) {
        let matchResult = true
        typeList.push(technicianItem.skillInfo[projectItem.project.id].type)
        for (let add of projectItem.additions) {
          if (!technicianItem.skillInfo[add.id] || !technicianItem.skillInfo[add.id].type) {
            matchResult = false
          } else {
            typeList.push(technicianItem.skillInfo[add.id].type)
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
          technicianMatchList.push({ type, technicianItem, delayTime, projectPriorityTime, projectItem })
        }
      }
    })
    return technicianMatchList
  },
  counts(preAssignList) {
    console.time('count')
    const countInfo = {}
    preAssignList.forEach((item) => {
      if (!countInfo[item.orderID]) {
        countInfo[item.orderID] = { number: 1 }
      } else {
        countInfo[item.orderID].number += 1
      }
      item.number = countInfo[item.orderID].number
    })

    console.timeEnd('count')
    return preAssignList
  },
  assign({ technicianList, orderList, assignedList }) {
    for (let orderItem of orderList) {
      const orderMatchPreAssignList = assignedList.filter((x) => x.orderID == orderItem.id)
      let prevProjectEndTime = new Date(0)
      if (orderMatchPreAssignList.length) {
        prevProjectEndTime = Math.max(...orderMatchPreAssignList.map((x) => x.timeEnd))
      }
      console.log(prevProjectEndTime)
      const notAssignProject = orderItem.orderInfo.filter((projectItem) => {
        return !orderMatchPreAssignList.find((x) => x.orderID == orderItem.id && x.projectID == projectItem.project.id)
      })
      if (notAssignProject.length == 0) {
        continue
      }
      const projectQueue = []
      notAssignProject.forEach((projectItem, i) => {
        const projectPriorityTime = i * localStorage.priorityTime
        const technicianMatchList = this.findTechnician({ projectItem, technicianList, projectPriorityTime })
        projectQueue.push(...technicianMatchList)
      })
      console.log({ projectQueue })
      // const TechnicianTimeList = this.getTechnicianTimeList({
      //   prevProjectEndTime,
      //   orderItem,
      //   projectQueue,
      //   workListObj,
      //   preAssignList
      // })
      // console.log({ notAssignProject })
      return { orderItem, notAssignProject }
      // const r = this.assignOrder({
      //   technicianList,
      //   orderList,
      //   orderItem,
      //   level,
      //   preAssignList,
      //   workListObj,
      //   historyPreAssignList,
      //   historyItems,
      //   doDelayProjectList: [...doDelayProjectList]
      // })
    }
    // return { preAssignList, state: 'complete', historyPreAssignList, historyLevel: level }
  },
  // assignOrder() {
  //   if(notAssignProjects.length==0){
  //     return preAssignList
  //   }
  //   const TechnicianTimeList = this.getTechnicianTimeList()
  //   for (let TechnicianTimeItem of TechnicianTimeList) {
  //     const r = this.assignItem(TechnicianTimeItem)
  //     if(r.state=='fail'){
  //       continue
  //     }else{
  //       return this.assignOrder({notAssignProjects})
  //     }
  //   }
  // },
  clone(obj) {
    return JSON.parse(JSON.stringify(obj), (k, v) => {
      if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
        return new Date(v)
      }
      return v
    })
  },
  init(Vue) {
    this.assignpProjects()
    // setInterval(() => {
    //   window.algorithm.timeDuration += 1000 * 60
    //   this.assignpProjects()
    // }, 1000 * 60)

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
