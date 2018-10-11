const { ipcRenderer } = require('electron')
ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"
})
window.ipcRenderer = ipcRenderer
window.algorithm = {
  clockScheduleIntervals: 15, // 粗算表时间间隔
  durationPerOrder: 45,
  timeDuration: 0,
  tempTechnicianList: [],
  tempPandAStandardTime: {},
  workingTableList: [],
  data: {
    orderObj: {},
    positionObj: { maxIndex: 0 },
    technicianList: [],
    assignList: [],
    timeList: [],
    preAssignList: []
    // techStatus: {} // statue:free busy
  },
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
  openWindow(
    screenName,
    config = {
      width: 800,
      height: 600
    }
  ) {
    console.log('openWindow')
    const BrowserWindow = require('electron').remote.BrowserWindow
    // config.show = false
    let win = new BrowserWindow(config)
    win.on('closed', () => {
      win = null
    })
    // win.webContents.toggleDevTools()
    // 加载远程URL
    win.loadURL(`atom://atom/static/${screenName}.html`)
    // win.loadURL('http://localhost:8080')
  },
  openDevWin() {
    this.openWindow('dev-screen', { width: 1024, height: 768 })
  },
  async setDev(preAssignList) {
    window.ipcRenderer.send('send-dev', JSON.stringify(preAssignList))
    console.log('setDev')
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
  async getAttendanceInfo() {
    const attendanceInfo = {}
    const dateBegin = this.getDateStart()
    console.time('getAttendanceInfo')
    await window.IDB.executeTransaction(['attendance'], 'readonly', (t) => {
      const store = t.objectStore('attendance')
      const request = store.index('date').openCursor(IDBKeyRange.only(dateBegin))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.isAttend) {
            attendanceInfo[cursor.value.id] = cursor.value
          }
          cursor.continue()
        }
      }
    })
    console.timeEnd('getAttendanceInfo')
    return attendanceInfo
  },
  getTechCount({ time }) {
    let count = 0
    this.data.technicianList.forEach((x) => {
      let item = x.attendanceInfo
      if (item.startTime <= time && item.endTime > time && !(item.lunchTime <= time && item.lunchTimeEnd > time)) {
        count += 1
      }
    })
    return count
  },
  getClockSchedule() {
    console.time('getClockSchedule')
    const workBeginTime = this.workBeginTime()
    const workEndTime = this.workEndTime()
    const timeList = []
    let workTime = new Date(workBeginTime)
    let lastTimeItem = null
    while (workTime < workEndTime) {
      let orderCount, index
      let time = workTime.toLocaleTimeString('en-GB').replace(/:00$/, '')
      let techCount = this.getTechCount({ time })
      if (lastTimeItem && lastTimeItem.techCount == techCount) {
        let type = lastTimeItem.index % 2 == 1 ? 'floor' : 'ceil'
        orderCount = Math[type]((techCount * this.clockScheduleIntervals) / this.durationPerOrder)
        index = lastTimeItem.index + 1
      } else {
        orderCount = Math.ceil((techCount * this.clockScheduleIntervals) / this.durationPerOrder)
        index = 1
      }
      let timeItem = { time, techCount, orderCount, index }
      timeList.push(timeItem)
      lastTimeItem = timeItem
      workTime = new Date(workTime.getTime() + this.clockScheduleIntervals * 60 * 1000)
    }
    console.timeEnd('getClockSchedule')
    this.data.timeList = timeList
  },
  async assignpProjects() {
    console.log('assignpProjects')
  },
  computingTechLastClock(technician) {
    let lastClockStartTimeStr
    let lastClockTimeStr = technician.attendanceInfo.startTime
    let lastRelativeClockTimeStr = technician.attendanceInfo.startTime
    if (
      technician.attendanceInfo.lunchTime <= lastClockTimeStr &&
      technician.attendanceInfo.lunchTimeEnd > lastClockTimeStr
    ) {
      lastClockTimeStr = lastRelativeClockTimeStr = technician.attendanceInfo.lunchTimeEnd
    }

    this.data.assignList.concat(this.data.preAssignList).forEach((x) => {
      if (x.techID == technician.id && lastClockTimeStr < x.timeEndStr) {
        lastClockTimeStr = x.timeEndStr
        lastClockStartTimeStr = x.timeStartStr
      }
      if (x.techID == technician.id && x.orderRule != '由后到前' && lastRelativeClockTimeStr < x.timeEndStr) {
        lastRelativeClockTimeStr = x.timeEndStr
      }
    })
    let time = this.getTimeByStr(lastClockTimeStr)
    if (lastClockStartTimeStr) {
      if (
        lastClockStartTimeStr <= technician.attendanceInfo.lunchTime &&
        lastClockTimeStr > technician.attendanceInfo.lunchTime
      ) {
        time = new Date(time.getTime() + technician.attendanceInfo.lunchTimeDuration * 60 * 1000)
      }
    }
    technician.lastClock = {
      timeStr: this.getTimeStr(time),
      time,
      relativeTime: this.getTimeByStr(lastRelativeClockTimeStr),
      relativeTimeStr: lastRelativeClockTimeStr
    }
  },
  async getTechnicianList() {
    const attendanceInfo = {}
    const technicianList = []
    await window.IDB.executeTransaction(['attendance', 'technician'], 'readonly', (t) => {
      const store = t.objectStore('attendance')
      const request = store.index('date').openCursor(IDBKeyRange.only(this.getDateStart()))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.isAttend) {
            attendanceInfo[cursor.value.id] = cursor.value
            const getTechnicianRequest = t.objectStore('technician').get(cursor.value.id)
            getTechnicianRequest.onsuccess = (e) => {
              if (e.target.result) {
                e.target.result.attendanceInfo = cursor.value
                this.computingTechLastClock(e.target.result)
                technicianList.push(e.target.result)
              }
            }
          }
          cursor.continue()
        }
      }
    })
    this.data.technicianList = technicianList.sort((a, b) => a.lastClock.relativeTime - b.lastClock.relativeTime)
    this.getClockSchedule()
  },
  async getWorkingTable() {
    const r = await window.IDB.getAll('workingTable', this.getDateStart())
    this.workingTableList = r || []
  },
  async getScheduleData() {
    const r = await window.IDB.get('schedule', this.getDateStart())
    if (r) {
      this.data.positionObj = r.positionObj
      this.data.orderObj = r.orderObj
      this.data.assignList = r.assignList || []
      console.log(this.data, r)
    } else {
      this.data.orderObj = {}
      this.data.positionObj = { maxIndex: 0 }
      this.data.technicianList = []
      this.data.assignList = []
      this.data.timeList = []
      this.data.preAssignList = []
    }
  },
  saveScheduleData() {
    window.IDB.put('schedule', {
      orderObj: this.data.orderObj,
      positionObj: this.data.positionObj,
      assignList: this.data.assignList,
      date: this.getDateStart()
    })
  },
  assign() {
    console.time('assign')
    console.time('clone')
    this.tempTechnicianList = this.clone(this.data.technicianList)
    console.timeEnd('clone')
    this.data.preAssignList = []
    this.tempTastClock = {}
    const orderList = this.getArriveOrder()
    for (const order of orderList) {
      this.assignOrder(order)
    }
    console.timeEnd('assign')
    console.log(this.data.preAssignList)
  },
  assignOrder(order) {
    // debugger
    // ----错误的脑洞----
    // 先去找所有空闲的技师，算出技能-时间列表，依次根据delayTime、 relativeTime 排序（小项relativeTime反着排）
    // 如果空闲技师不能做，根据技师下钟顺序找匹配的，类似 matchProject
    // 感觉不太对，还是按以前的算法
    const priorityTime = localStorage.priorityTime
    // ----要排除已经排过的项目----
    const waitingProjectList = order.orderInfo
      .filter((x) => x.assignItemID == null)
      .sort((x, y) => x.kind.priority - y.kind.priority)

    waitingProjectList.forEach((projectItem, i) => {
      projectItem.projectPriorityTime = i * priorityTime
    })
    // 寻找匹配技能的技师，如果上次结束时间太晚，就没必要匹配了直接忽略
    const technicianTimeList = []
    let relativeTimeStartAndDelay = new Date('3000-1-1')
    for (let tech of this.tempTechnicianList) {
      let relativeTimeStart = new Date(Math.max(this.getDateNow(), tech.lastClock.relativeTime))
      if (relativeTimeStart > relativeTimeStartAndDelay) break
      let matchProjectItem = this.matchProject({ tech, waitingProjectList })
      if (matchProjectItem) {
        technicianTimeList.push(matchProjectItem)
        let relativeTimeStartAndDelayThis = new Date(
          matchProjectItem.relativeTimeStart.getTime() + matchProjectItem.delayTime * 60 * 1000
        )
        if (relativeTimeStartAndDelay > relativeTimeStartAndDelayThis) {
          relativeTimeStartAndDelay = relativeTimeStartAndDelayThis
        }
      }
    }
    if (technicianTimeList.length <= 0) {
      console.log('没有找到匹配的技师')
      return
    }
    // 按相对时间排序（因为小项不过单）如果时间一样，小项优先级最低的做，其他优先级高的做
    technicianTimeList.sort((a, b) => {
      // 由前到后的排序时间
      let timeA = a.relativeTimeStart.getTime() + a.delayTime * 60 * 1000
      let timeB = b.relativeTimeStart.getTime() + b.delayTime * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + a.delayTime * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + b.delayTime * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (timeDif == 0 && a.projectItem.kind.orderRule == '由后到前' && b.projectItem.kind.orderRule == '由后到前') {
        return b.tech.lastClock.relativeTime - a.tech.lastClock.relativeTime
      }

      if (timeDif == 0 && a.projectItem.kind.orderRule == '由前到后' && b.projectItem.kind.orderRule == '由前到后') {
        return a.tech.lastClock.relativeTime - b.tech.lastClock.relativeTime
      }
      return timeDif
    })
    this.assignItem(technicianTimeList[0], order)
  },
  getDuration({ tech, projectItem }) {
    let duration = projectItem.project.standardTime || 0
    for (let add of projectItem.additions) {
      duration += add.standardTime || 0
    }
    let durationDiff = tech.skillInfo[projectItem.project.id].timeDiff || 0
    for (let add of projectItem.additions) {
      durationDiff += tech.skillInfo[add.id].timeDiff || 0
    }
    return duration + durationDiff
  },
  assignItem(matchProjectItem, order) {
    let lastNumber = 0
    for (let item of order.orderInfo) {
      const itemNumber = item.number || 0
      if (lastNumber < itemNumber) lastNumber = itemNumber
    }

    // 计算技师时调

    const item = {
      id: this.getNewID(),
      techName: matchProjectItem.tech.name,
      techID: matchProjectItem.tech.id,
      orderName: order.name,
      orderID: order.id,
      number: lastNumber + 1, // 待改进
      count: order.orderInfo.length,
      orderRule: matchProjectItem.projectItem.kind.orderRule,
      projectName: matchProjectItem.projectItem.project.name,
      projectID: matchProjectItem.projectItem.project.id,
      workingTableID: matchProjectItem.projectItem.project.workingTableID,
      fixedTable:
        matchProjectItem.tech.fixedTableList &&
        matchProjectItem.tech.fixedTableList.includes(matchProjectItem.projectItem.project.workingTableID),
      timeStartStr: this.getTimeStr(matchProjectItem.timeStart),
      timeStart: matchProjectItem.timeStart,
      timeEndStr: this.getTimeStr(matchProjectItem.timeEnd),
      timeEnd: matchProjectItem.timeEnd,
      duration: matchProjectItem.duration,
      status: 'waiting'
    }

    this.data.preAssignList.push(item)

    // 更改技师的最后完成时间
    const tech = this.tempTechnicianList.find((x) => x.id == item.techID)
    let time = item.timeEnd
    if (item.orderRule != '由后到前') {
      tech.lastClock.relativeTime = item.timeEnd
      tech.lastClock.relativeTimeStr = item.timeEndStr
    }
    if (item.timeStartStr <= tech.attendanceInfo.lunchTime && item.timeEndStr > tech.attendanceInfo.lunchTime) {
      time = new Date(time.getTime() + tech.attendanceInfo.lunchTimeDuration * 60 * 1000)
      tech.lastClock.relativeTime = time
      tech.lastClock.relativeTimeStr = this.getTimeStr(time)
    }

    tech.lastClock.time = time
    tech.lastClock.timeStr = this.getTimeStr(time)

    // 更新排序
    this.tempTechnicianList.sort((a, b) => a.lastClock.relativeTime - b.lastClock.relativeTime)
  },
  matchProject({ tech, waitingProjectList }) {
    let timeStart = new Date(Math.max(this.getDateNow(), tech.lastClock.time))
    let relativeTimeStart = new Date(Math.max(this.getDateNow(), tech.lastClock.relativeTime))
    let matchProjectObj = { tech, timeStart, relativeTimeStart, delayTotal: 999999 } // projectID  projectPriorityTime delayTime type
    const list = []
    waitingProjectList.forEach((projectItem) => {
      if (projectItem.technicians.length > 0) {
        let hasTech = projectItem.technicians.find((i) => i.id == tech.id)
        if (!hasTech) return
        matchProjectObj.projectItem = projectItem
        matchProjectObj.delayTime = 0
        matchProjectObj.projectPriorityTime = projectItem.projectPriorityTime
        matchProjectObj.delayTotal = 0
        matchProjectObj.type = 'major'
        const wtObj = this.getWorkingTableTimeStartObj(matchProjectObj)
        if (wtObj) {
          list.push(wtObj)
        }
      } else {
        if (tech.skillInfo[projectItem.project.id] && tech.skillInfo[projectItem.project.id].type) {
          let typeList = []
          let matchResult = true
          typeList.push(tech.skillInfo[projectItem.project.id].type)
          for (let add of projectItem.additions) {
            if (!tech.skillInfo[add.id] || !tech.skillInfo[add.id].type) {
              matchResult = false
              break
            } else {
              typeList.push(tech.skillInfo[add.id].type)
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
            let delayTotal = delayTime + projectItem.projectPriorityTime
            const matchItem = {
              ...matchProjectObj,
              projectItem,
              delayTime,
              projectPriorityTime: projectItem.projectPriorityTime,
              delayTotal,
              type
            }
            const wtObj = this.getWorkingTableTimeStartObj(matchItem)
            if (wtObj) {
              list.push(wtObj)
            }
          }
        }
      }
    })
    if (list.length > 0) {
      return list.sort(
        (a, b) => a.timeStart.getTime() + a.delayTotal * 60 * 1000 - b.timeStart.getTime() - b.delayTotal * 60 * 1000
      )[0]
    }
    return false
  },
  getWorkingTableTimeStartObj({ tech, projectItem, timeStart, relativeTimeStart, delayTotal }) {
    const rObj = { ...arguments[0] }

    // 判断是否是午餐时间
    const lunchTimeStart = this.getTimeByStr(tech.attendanceInfo.lunchTime)
    const lunchTimeEnd = new Date(lunchTimeStart.getTime() + tech.attendanceInfo.lunchTimeDuration * 60 * 1000)
    if (timeStart >= lunchTimeStart && timeStart < lunchTimeEnd) {
      rObj.timeStart = lunchTimeEnd
      return this.getWorkingTableTimeStartObj(rObj)
    }

    const duration = this.getDuration({ tech, projectItem })
    rObj.duration = duration
    const fixedTableList = tech.fixedTableList || []
    let timeEnd = new Date(timeStart.getTime() + duration * 60 * 1000)
    rObj.timeEnd = timeEnd
    const workingTableID = projectItem.project.workingTableID
    if (workingTableID && !fixedTableList.includes(workingTableID)) {
      const workingTableItem = this.workingTableList.find((x) => x.id == workingTableID)
      if (workingTableItem && workingTableItem.count > 0) {
        let fixCount = this.data.technicianList.filter((x) => {
          let fixedList = x.fixedTableList || []
          return fixedList.includes(workingTableID)
        }).length
        let freeCount = workingTableItem.count - fixCount
        if (freeCount <= 0) {
          return false
        }
        const matchPreAssignList = this.data.assignList
          .concat(this.data.preAssignList)
          .filter(
            (p) =>
              p.workingTableID == workingTableID &&
              p.technicianID != tech.id &&
              !p.fixedTable &&
              !(p.timeStart >= timeEnd || p.timeEnd <= timeStart)
          )
        const countSet = new Set(matchPreAssignList.map((m) => m.technicianID))
        if (countSet.size >= freeCount) {
          matchPreAssignList.sort((a, b) => a.timeEnd - b.timeEnd)
          if (matchPreAssignList.length <= freeCount) {
            rObj.timeStart = new Date(matchPreAssignList[0].timeEnd)
          } else {
            rObj.timeStart = new Date(matchPreAssignList[matchPreAssignList.length - freeCount].timeEnd)
          }

          rObj.relativeTimeStart = rObj.timeStart
          rObj.timeEnd = new Date(rObj.timeStart.getTime() + duration * 60 * 1000)
          return this.getWorkingTableTimeStartObj(rObj)
        }
      }
    }
    return rObj
  },
  getArriveOrder() {
    const orderList = []
    Object.keys(this.data.orderObj).forEach((x) => {
      let order = this.data.orderObj[x]
      if (order.isArrive && order.isfree) {
        orderList.push(order)
      }
    })

    orderList.sort((x, y) => {
      let pX = x.timePositions[0]
      let pY = y.timePositions[0]
      if (pX.time.getTime() == pY.time.getTime()) {
        return pX.number - pY.number
      }
      return pX.time - pY.time
    })
    return orderList
  },
  endAssignItem(assignItem) {
    assignItem.status = 'end'

    assignItem.timeEnd = new Date(Math.max(this.getDateNow(), assignItem.timeEnd))
    assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
    assignItem.realTimeEnd = this.getDateNow()
    assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)

    const order = this.data.orderObj[assignItem.orderID]
    if (order.orderInfo.find((x) => x.assignItemID == null)) {
      order.isfree = true
    }
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()
  },
  startAssignItem(assignItem) {
    assignItem.status = 'start'

    assignItem.timeStart = new Date(Math.max(this.getDateNow(), assignItem.timeStart))
    assignItem.timeStartStr = this.getTimeStr(assignItem.timeStart)
    assignItem.timeEnd = new Date(assignItem.timeStart.getTime() + assignItem.duration * 60 * 1000)
    assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
    // 记录真实时间
    assignItem.realTimeStart = this.getDateNow()
    assignItem.realTimeStartStr = this.getTimeStr(assignItem.realTimeStart)
    assignItem.realTimeEnd = new Date(assignItem.realTimeStart.getTime() + assignItem.duration * 60 * 1000)
    assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)

    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()
  },
  cancelAssignItem(assignItem, index) {
    try {
      this.data.assignList.splice(index, 1)
      const order = this.data.orderObj[assignItem.orderID]
      order.isfree = true
      const orderInfoItem = order.orderInfo.find((x) => x.project.id == assignItem.projectID)
      orderInfoItem.assignItemID = null
      delete orderInfoItem.number
    } finally {
      const tech = this.data.technicianList.find((x) => x.id == assignItem.techID)
      if (tech) {
        this.computingTechLastClock(tech)
        // 更新排序
        this.data.technicianList.sort((a, b) => a.lastClock.relativeTime - b.lastClock.relativeTime)
      }
      this.assign()
      this.saveScheduleData()
    }
  },
  manuallyUnshiftToAssignList(assignItem) {
    assignItem.realTimeStart = assignItem.timeStart
    assignItem.realTimeStartStr = assignItem.timeStartStr
    assignItem.realTimeEnd = assignItem.timeEnd
    assignItem.realTimeEndStr = assignItem.timeEndStr

    this.data.assignList.unshift(assignItem)
    this.data.orderObj[assignItem.orderID].isfree = false
    const orderItem = this.data.orderObj[assignItem.orderID].orderInfo.find((x) => x.project.id == assignItem.projectID)
    orderItem.number = assignItem.number
    orderItem.assignItemID = assignItem.id
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()
  },
  unshiftToAssignList(assignItem, status, index) {
    this.data.preAssignList.splice(index, 1)
    assignItem.status = status
    if (status == 'start') {
      assignItem.timeStart = new Date(Math.max(this.getDateNow(), assignItem.timeStart))
      assignItem.timeStartStr = this.getTimeStr(assignItem.timeStart)
      assignItem.timeEnd = new Date(assignItem.timeStart.getTime() + assignItem.duration * 60 * 1000)
      assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
      // 记录真实时间
      assignItem.realTimeStart = this.getDateNow()
      assignItem.realTimeStartStr = this.getTimeStr(assignItem.realTimeStart)
      assignItem.realTimeEnd = new Date(assignItem.realTimeStart.getTime() + assignItem.duration * 60 * 1000)
      assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)
    } else if (status == 'fix') {
      assignItem.realTimeStart = assignItem.timeStart
      assignItem.realTimeStartStr = assignItem.timeStartStr
      assignItem.realTimeEnd = assignItem.timeEnd
      assignItem.realTimeEndStr = assignItem.timeEndStr
    }
    this.data.assignList.unshift(assignItem)
    this.data.orderObj[assignItem.orderID].isfree = false
    const orderItem = this.data.orderObj[assignItem.orderID].orderInfo.find((x) => x.project.id == assignItem.projectID)
    orderItem.number = assignItem.number
    orderItem.assignItemID = assignItem.id
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()
    // orderObj
  },
  setTechLastClock(assignItem) {
    const tech = this.data.technicianList.find((x) => x.id == assignItem.techID)
    if (!tech) return
    let time = assignItem.timeEnd
    if (assignItem.orderRule != '由后到前') {
      tech.lastClock.relativeTime = assignItem.timeEnd
      tech.lastClock.relativeTimeStr = assignItem.timeEndStr
    }
    if (
      assignItem.timeStartStr <= tech.attendanceInfo.lunchTime &&
      assignItem.timeEndStr > tech.attendanceInfo.lunchTime
    ) {
      time = new Date(time.getTime() + tech.attendanceInfo.lunchTimeDuration * 60 * 1000)
      tech.lastClock.relativeTime = time
      tech.lastClock.relativeTimeStr = this.getTimeStr(time)
    }

    tech.lastClock.time = time
    tech.lastClock.timeStr = this.getTimeStr(time)

    // 更新排序
    this.data.technicianList.sort((a, b) => a.lastClock.relativeTime - b.lastClock.relativeTime)
  },
  async initData() {
    await this.getScheduleData()
    await this.getTechnicianList()
    await this.getWorkingTable()
    this.assign()
  },
  getTimeByStr(timeStr) {
    const hour = parseInt(timeStr.split(':')[0])
    const minute = parseInt(timeStr.split(':')[1])
    return new Date(this.getDateStart().getTime() + (hour * 60 + minute) * 60 * 1000)
  },
  getTimeStr(time) {
    if (time instanceof Date) return time.toLocaleTimeString('en-GB').replace(/:00$/, '')
    return ''
  },
  clone(obj) {
    return JSON.parse(JSON.stringify(obj), (k, v) => {
      if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
        return new Date(v)
      }
      return v
    })
  },
  getNewID() {
    const pn = performance.now()
    const time = new Date().getTime()
    const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(0, 3)
    const timeStr = `${time}${pnStr}`
    return parseInt(timeStr)
  },
  init(Vue) {
    this.initData()
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
