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
  jumpTechMap: new Map(),
  data: {
    // jumpTechList: [], // 跳过技师的列表，记录本可以做这个项目但是因为要做别的项目而错过的技师，每次往已分配里加项目的时候保存
    // assignedTechList: [], // 技师被分配的时候添加，有可能技师是本可以做别的项目，要记录，不然没法算等待时间
    // tempJumpTechList: [], // 每次排队的时候记录技师等待列表，结合assignedTechList可以得知每个项目跳过的技师
    lockedPosition: [],
    customTimeCountObj: {},
    orderObj: {},
    positionObj: { maxIndex: 0 },
    technicianList: [],
    assignList: [],
    timeList: [],
    preAssignList: [],
    advancTechIDList: [],
    advancMultiList: [],
    remainOrderList: [],
    unmatchOrderList: []
    // techStatus: {} // statue:free busy
  },
  getIPAdress() {
    let address = ''
    let interfaces = require('os').networkInterfaces()
    for (var devName in interfaces) {
      var iface = interfaces[devName]
      for (var i = 0; i < iface.length; i++) {
        let alias = iface[i]
        if (
          alias.family === 'IPv4' &&
          alias.address !== '127.0.0.1' &&
          !alias.internal
        ) {
          address = alias.address
        }
      }
    }
    return address
  },
  isRealtime() {
    return localStorage.realtime == 'true'
  },
  getDateNow() {
    let isRealtime = localStorage.realtime == 'true'
    if (isRealtime) {
      return new Date()
    }

    const date = localStorage.dateTimeNow
      ? new Date(localStorage.dateTimeNow)
      : new Date('2018/2/26')

    return new Date(date.getTime() + this.timeDuration)
  },
  getDateStart() {
    return new Date(this.getDateNow().toDateString())
  },
  getDateEnd() {
    // return new Date(this.getDateStart().getTime() + 24 * 60 * 60 * 1000 - 1)
    return new Date(this.getDateStart().setHours(24) - 1)
  },
  print(data) {
    const BrowserWindow = require('electron').remote.BrowserWindow
    let win = new BrowserWindow({
      width: 70 * 8,
      height: 99 * 8,
      useContentSize: true
    })
    win.on('closed', () => {
      win = null
    })
    win.webContents.toggleDevTools()
    // 加载远程URL
    win.loadURL(`atom://atom/static/print.html`)
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
    // return new Date(this.getDateStart().getTime() + time * 60 * 60 * 1000)
    return new Date(this.getDateStart().setHours(time))
  },
  workEndTime() {
    const day = this.getDateNow().getDay()
    let time
    if (day > 0 && day < 6) {
      time = parseInt(localStorage.workEndTime)
    } else {
      time = parseInt(localStorage.weekendEndTime)
    }
    // return new Date(this.getDateStart().getTime() + time * 60 * 60 * 1000)
    return new Date(this.getDateStart().setHours(time))
  },
  async getAttendanceInfo() {
    const attendanceInfo = {}
    const dateBegin = this.getDateStart()
    console.time('getAttendanceInfo')
    await window.IDB.executeTransaction(['attendance'], 'readonly', t => {
      const store = t.objectStore('attendance')
      const request = store
        .index('date')
        .openCursor(IDBKeyRange.only(dateBegin))
      request.onsuccess = event => {
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
    this.data.technicianList.forEach(x => {
      let item = x.attendanceInfo
      if (
        item.startTime <= time &&
        item.endTime > time &&
        !(item.lunchTime <= time && item.lunchTimeEnd > time)
      ) {
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
        orderCount = Math[type](
          (techCount * this.clockScheduleIntervals) / this.durationPerOrder
        )
        index = lastTimeItem.index + 1
      } else {
        orderCount = Math.ceil(
          (techCount * this.clockScheduleIntervals) / this.durationPerOrder
        )
        index = 1
      }
      let timeItem = {
        time,
        techCount,
        orderCount,
        index,
        originalCount: orderCount
      }
      // 自定义格子
      let addCount = this.data.customTimeCountObj[time]
      if (addCount) {
        timeItem.orderCount += addCount
        timeItem.addCount = addCount
      }

      timeList.push(timeItem)
      lastTimeItem = timeItem
      workTime = new Date(
        workTime.getTime() + this.clockScheduleIntervals * 60 * 1000
      )
    }
    console.timeEnd('getClockSchedule')
    this.data.timeList = timeList
  },
  async assignpProjects() {
    console.log('assignpProjects')
  },
  batchComputingTechLastClock() {
    this.data.technicianList.forEach(x => this.computingTechLastClock(x))
    this.data.technicianList.sort((a, b) => {
      // let timeDiff = a.lastClock.relativeTime - b.lastClock.relativeTime
      let timeDiff = this.compareLastClock(a, b)
      if (timeDiff == 0) return this.compareString(a.name, b.name)
      return timeDiff
    })
  },
  computingTechLastClock(technician) {
    let lastClockStartTimeStr
    let lastClockTimeStr = technician.attendanceInfo.startTime
    let lastRelativeClockTimeStr = technician.attendanceInfo.startTime
    if (
      technician.attendanceInfo.lunchTime <= lastClockTimeStr &&
      technician.attendanceInfo.lunchTimeEnd > lastClockTimeStr
    ) {
      lastClockTimeStr = lastRelativeClockTimeStr =
        technician.attendanceInfo.lunchTimeEnd
    }

    // this.data.assignList.concat(this.data.preAssignList).forEach((x) => {
    this.data.assignList.forEach(x => {
      if (x.techID == technician.id && lastClockTimeStr < x.timeEndStr) {
        lastClockTimeStr = x.timeEndStr
        lastClockStartTimeStr = x.timeStartStr
      }
      if (
        x.techID == technician.id &&
        x.orderRule != '由后到前' &&
        lastRelativeClockTimeStr < x.timeEndStr
      ) {
        lastRelativeClockTimeStr = x.timeEndStr
      }
    })
    let time = this.getTimeByStr(lastClockTimeStr)
    let computedLunch = false
    if (lastClockStartTimeStr) {
      if (
        lastClockStartTimeStr <= technician.attendanceInfo.lunchTime &&
        lastClockTimeStr > technician.attendanceInfo.lunchTime
      ) {
        time = new Date(
          time.getTime() +
            technician.attendanceInfo.lunchTimeDuration * 60 * 1000
        )
        // 午餐时间要过单
        lastRelativeClockTimeStr = this.getTimeStr(time)
        computedLunch = true
      }
    }
    const timeNowStr = this.getTimeStr(this.getDateNow())
    // 如果超过了午餐时间 并且 没有计算过午餐时间，修改技师的最后时间
    if (
      !computedLunch &&
      timeNowStr >= technician.attendanceInfo.lunchTime &&
      // timeNowStr < technician.attendanceInfo.lunchTimeEnd &&
      technician.attendanceInfo.lunchTimeEnd > lastClockTimeStr
    ) {
      time = this.getTimeByStr(technician.attendanceInfo.lunchTimeEnd)
      // 午餐时间要过单
      lastRelativeClockTimeStr = technician.attendanceInfo.lunchTimeEnd
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
    await window.IDB.executeTransaction(
      ['attendance', 'technician'],
      'readonly',
      t => {
        const store = t.objectStore('attendance')
        const request = store
          .index('date')
          .openCursor(IDBKeyRange.only(this.getDateStart()))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            if (cursor.value.isAttend) {
              attendanceInfo[cursor.value.id] = cursor.value
              const getTechnicianRequest = t
                .objectStore('technician')
                .get(cursor.value.id)
              getTechnicianRequest.onsuccess = e => {
                if (e.target.result) {
                  e.target.result.attendanceInfo = cursor.value
                  e.target.result.lastClock = {}
                  // this.computingTechLastClock(e.target.result)
                  technicianList.push(e.target.result)
                }
              }
            }
            cursor.continue()
          }
        }
      }
    )
    this.data.technicianList = technicianList
    // this.data.technicianList = technicianList.sort((a, b) => {
    //   let timeDiff = a.lastClock.relativeTime - b.lastClock.relativeTime
    //   if (timeDiff == 0) return this.compareString(a.name, b.name)
    //   return timeDiff
    // })
    this.getClockSchedule()
  },
  compareLastClock(techA, techB) {
    // debugger
    // 先 techA.lastClock.relativeTime - techB.lastClock.relativeTime
    // 如果relativeTime是技师的出勤开始时间，那么就让relativeTime等于tech.lastEndClock.relativeTimeye
    // 也就是技师之前的某一天的最后完成时间，然后在比较
    let relativeTimeA = techA.lastClock.relativeTime
    let relativeTimeB = techB.lastClock.relativeTime
    let diff = relativeTimeA - relativeTimeB
    if (diff != 0) {
      return diff
    }

    if (techA.lastEndClock) {
      let startTimeStr = techA.attendanceInfo.startTime
      if (
        techA.attendanceInfo.lunchTime <= startTimeStr &&
        techA.attendanceInfo.lunchTimeEnd > startTimeStr
      ) {
        startTimeStr = techA.attendanceInfo.lunchTimeEnd
      }
      if (
        relativeTimeA instanceof Date &&
        relativeTimeA.getTime() == this.getTimeByStr(startTimeStr).getTime()
      ) {
        relativeTimeA = techA.lastEndClock.relativeTime
      }
    } else {
      relativeTimeA = new Date(0)
    }
    if (techB.lastEndClock) {
      let startTimeStr = techB.attendanceInfo.startTime
      if (
        techB.attendanceInfo.lunchTime <= startTimeStr &&
        techB.attendanceInfo.lunchTimeEnd > startTimeStr
      ) {
        startTimeStr = techB.attendanceInfo.lunchTimeEnd
      }
      if (
        relativeTimeB instanceof Date &&
        relativeTimeB.getTime() == this.getTimeByStr(startTimeStr).getTime()
      ) {
        relativeTimeB = techB.lastEndClock.relativeTime
      }
    } else {
      relativeTimeB = new Date(0)
    }

    return relativeTimeA - relativeTimeB
  },
  compareString(a, b) {
    if (a < b) {
      // 按某种排序标准进行比较, a 小于 b
      return -1
    }
    if (a > b) {
      return 1
    }
    // a must be equal to b
    return 0
  },
  async getWorkingTable() {
    const r = await window.IDB.getAll('workingTable', this.getDateStart())
    this.workingTableList = r || []
  },
  async getScheduleData() {
    const r = await window.IDB.get('schedule', this.getDateStart())
    if (r) {
      this.data.positionObj = r.positionObj || { maxIndex: 0 }
      this.data.orderObj = r.orderObj || {}
      this.data.assignList = r.assignList || []
      this.data.customTimeCountObj = r.customTimeCountObj || {}
      this.jumpTechMap = r.jumpTechMap || new Map()
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
      customTimeCountObj: this.data.customTimeCountObj,
      jumpTechMap: this.jumpTechMap,
      date: this.getDateStart()
    })
    console.log('saveScheduleData')
    window.algDataChange.scheduleDataChange()
  },
  assign() {
    this.data.assignList.sort(
      (a, b) => b.timeEnd.getTime() - a.timeEnd.getTime()
    )

    this.batchComputingTechLastClock()
    console.time('assign')
    console.time('clone')
    this.tempTechnicianList = this.clone(this.data.technicianList)
    console.timeEnd('clone')
    // 初始化数据
    // this.data.tempJumpTechList = []
    this.data.preAssignList = []
    this.data.advancTechIDList = []
    this.data.advancMultiList = []
    this.data.remainOrderList = []
    this.data.unmatchOrderList = []

    this.tempTastClock = {}
    const { orderList, advanceNowList, advanceList } = this.getOrder()

    // 先排advanceNowList
    advanceNowList.forEach(x => this.assignAdvanceNowOrder(x))

    // 再计算提前计算的
    this.advanceCalculation(advanceList)

    // 排一般订单
    for (const order of orderList) {
      this.assignOrder(order)
    }
    // 排提前计算
    for (const advanceItem of advanceList) {
      this.assignAdvanceOrder(advanceItem)
    }
    // 排剩余的 remainOrderList
    this.data.advancTechIDList = []
    this.data.advancMultiList = []
    for (const order of this.data.remainOrderList) {
      this.assignOrder(order)
    }
    console.timeEnd('assign')
    // console.log(this.data.preAssignList)
  },
  assignOrder(order) {
    const priorityTime = localStorage.priorityTime
    // ----要排除已经排过的项目----
    const waitingProjectList = order.orderInfo
      .filter(x => x.assignItemID == null)
      .sort((x, y) => x.kind.priority - y.kind.priority)

    if (waitingProjectList.length <= 0) {
      return
    }

    waitingProjectList.forEach((projectItem, i) => {
      projectItem.projectPriorityTime = i * priorityTime
    })

    const technicianTimeList = []
    for (let tech of this.tempTechnicianList) {
      let matchProjectItem = this.matchProject({ tech, waitingProjectList })
      if (matchProjectItem) {
        technicianTimeList.push(matchProjectItem)
      }
    }
    if (technicianTimeList.length <= 0) {
      console.log('没有找到匹配的技师')
      this.data.unmatchOrderList.push({ order, waitingProjectList })
      return
    }
    // 按相对时间排序（因为小项不过单）如果时间一样，小项优先级最低的做，其他优先级高的做
    technicianTimeList.sort((a, b) => {
      // debugger
      // 由前到后的排序时间
      let timeA = a.relativeTimeStart.getTime() + a.delayTotal * 60 * 1000
      let timeB = b.relativeTimeStart.getTime() + b.delayTotal * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + a.delayTotal * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + b.delayTotal * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由后到前' &&
        b.projectItem.kind.orderRule == '由后到前'
      ) {
        // let diff = b.tech.lastClock.relativeTime - a.tech.lastClock.relativeTime
        let diff = this.compareLastClock(b.tech, a.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由前到后' &&
        b.projectItem.kind.orderRule == '由前到后'
      ) {
        // let diff = a.tech.lastClock.relativeTime - b.tech.lastClock.relativeTime
        let diff = this.compareLastClock(a.tech, b.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }
      if (timeDif == 0) return this.compareString(a.tech.name, b.tech.name)
      return timeDif
    })
    // 判断影不影响必做提前计算
    // 定义原始techitem（如果没有提前计算，技师本该排到的项目）
    // let orginTechitem = technicianTimeList[0]

    // debugger
    for (let techItem of technicianTimeList) {
      let canAssign = this.judgeAssign(techItem)
      if (canAssign) {
        this.assignItem(techItem, order)
        return
      } else {
        // else中是跳过的技师
        // 订单id，项目id，技师id，三个id作为唯一标示
        let id = `${order.id}-${techItem.projectItem.project.id}-${techItem.tech.id}`
        // 是覆盖还是只保存第一次的？this.jumpTechMap.has(id)
        this.jumpTechMap.set(id, {
          orderID: order.id,
          orderName: order.name,
          projectID: techItem.projectItem.project.id,
          projectName: techItem.projectItem.project.name,
          techID: techItem.tech.id,
          techName: techItem.tech.name,
          timeStart: techItem.timeStart,
          timeEnd: techItem.timeEnd
        })
      }
    }
    // 都无法排的时候加入最后排队列表
    this.data.remainOrderList.push(order)
  },
  computingTechWaitingTime({ assignList, jumpTechMap, date }, waitingConfig) {
    // 找到最大等待时间
    let waitPriceMax = 0
    if (waitingConfig) {
      let waitMax = waitingConfig.find(x => x.minutes == '最大时间')
      if (waitMax && waitMax.price) {
        waitPriceMax = waitMax.price
      }
    }

    let getWorkEndTime = date => {
      const day = date.getDay()
      let time
      if (day > 0 && day < 6) {
        time = parseInt(localStorage.workEndTime)
      } else {
        time = parseInt(localStorage.weekendEndTime)
      }
      // return new Date(
      //   new Date(date.toDateString()).getTime() + time * 60 * 60 * 1000
      // )
      return this.setTimeHoursAndMinutes(date, time)
    }
    let workEndTime = getWorkEndTime(date)
    // 根据 assignList和jumpTechMap计算技师等待时间
    // const assignList = this.data.assignList
    // const jumpTechMap = this.jumpTechMap
    // 跳过技师的项目，只能安排一次
    const jumpProjectSet = new Set()
    // 技师等待后做的项目，只能安排一次
    const waitforAssignSet = new Set()
    // 技师等待时间信息
    const techWaitingMap = new Map()
    jumpTechMap.forEach((value, key, map) => {
      let id = `${value.orderID}-${value.projectID}`
      // 安排过了就不安排了，一个项目只能有一个等待技师
      if (jumpProjectSet.has(id)) return
      let assignItem = assignList.find(x => {
        return x.orderID == value.orderID && x.projectID == value.projectID
      })
      // 项目没找到，也就不用算等待时间了
      if (!assignItem) {
        jumpProjectSet.add(id)
        return
      }
      // 说明技师没有等待还是做了原来的项目
      if (assignItem.techID == value.techID) {
        jumpProjectSet.add(id)
        return
      }
      // 技师等待后做的项目
      let waitforAssianItem = assignList
        .filter(x => x.techID == value.techID && x.timeEnd > value.timeStart)
        .sort((a, b) => a.timeStart.getTime() - b.timeStart.getTime())[0]
      let waitforAssingID = `null-${value.techID}`
      // 没找到项目，就说明是无限期等待
      if (waitforAssianItem) {
        waitforAssingID = waitforAssianItem.id
        // 说明技师没有等待
        if (waitforAssianItem.timeStart <= value.timeStart) return
      }
      // 说明被安排过了，就不再安排了，直接跳过
      if (waitforAssignSet.has(waitforAssingID)) return
      let techWaitItem = {
        ...value,
        waitforAssianItem
      }
      // 设置等待时间
      if (waitforAssianItem) {
        techWaitItem.waitingTime =
          (waitforAssianItem.timeStart - value.timeStart) / (1000 * 60)
      } else {
        techWaitItem.waitingTime = (workEndTime - value.timeStart) / (1000 * 60)
      }
      // 计算等待费用
      techWaitItem.waitingPrice = 0
      if (waitingConfig) {
        let waitObj = waitingConfig.find(
          x => x.minutes >= techWaitItem.waitingTime
        )
        if (waitObj) {
          techWaitItem.waitingPrice = waitObj.price || 0
        } else {
          techWaitItem.waitingPrice = waitPriceMax
        }
      }

      if (techWaitingMap.has(techWaitItem.techID)) {
        techWaitingMap.get(techWaitItem.techID).push(techWaitItem)
      } else {
        techWaitingMap.set(techWaitItem.techID, [techWaitItem])
      }
      jumpProjectSet.add(id)
      waitforAssignSet.add(waitforAssingID)
    })
    return techWaitingMap
  },
  // 提前计算
  assignAdvanceOrder({ order, projectItem, timeStart }) {
    projectItem.projectPriorityTime = 0
    // 寻找匹配技能的技师，如果上次结束时间太晚，就没必要匹配了直接忽略
    const technicianTimeList = []
    let relativeTimeStartAndDelay = new Date('3000-1-1')
    for (let tech of this.tempTechnicianList) {
      let relativeTimeStart = new Date(
        Math.max(this.getDateNow(), timeStart, tech.lastClock.relativeTime)
      )
      // if (relativeTimeStart > relativeTimeStartAndDelay) break
      let matchProjectItem = this.matchProject({
        advanceTimeStart: relativeTimeStart,
        relativeAdvanceTimeStart: relativeTimeStart, // weiwan
        tech,
        waitingProjectList: [projectItem]
      })
      if (matchProjectItem) {
        technicianTimeList.push(matchProjectItem)
        let relativeTimeStartAndDelayThis = new Date(
          matchProjectItem.relativeTimeStart.getTime() +
            matchProjectItem.delayTime * 60 * 1000
        )
        if (relativeTimeStartAndDelay > relativeTimeStartAndDelayThis) {
          relativeTimeStartAndDelay = relativeTimeStartAndDelayThis
        }
      }
    }
    if (technicianTimeList.length <= 0) {
      console.log('没有找到匹配的技师')
      this.data.unmatchOrderList.push({
        order,
        waitingProjectList: [projectItem]
      })
      return false
    }
    // 按相对时间排序（因为小项不过单）如果时间一样，小项优先级最低的做，其他优先级高的做
    technicianTimeList.sort((a, b) => {
      // 由前到后的排序时间
      let timeA = a.relativeTimeStart.getTime() + a.delayTotal * 60 * 1000
      let timeB = b.relativeTimeStart.getTime() + b.delayTotal * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + a.delayTotal * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + b.delayTotal * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由后到前' &&
        b.projectItem.kind.orderRule == '由后到前'
      ) {
        // let diff = b.tech.lastClock.relativeTime - a.tech.lastClock.relativeTime
        let diff = this.compareLastClock(b.tech, a.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由前到后' &&
        b.projectItem.kind.orderRule == '由前到后'
      ) {
        // let diff = a.tech.lastClock.relativeTime - b.tech.lastClock.relativeTime
        let diff = this.compareLastClock(a.tech, b.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }
      if (timeDif == 0) return this.compareString(a.tech.name, b.tech.name)
      return timeDif
    })
    // if (order.name == '到场正在做') debugger
    this.assignItem(technicianTimeList[0], order, true)
  },
  assignAdvanceNowOrder({ order, projectItem }) {
    projectItem.projectPriorityTime = 0
    // 寻找匹配技能的技师，如果上次结束时间太晚，就没必要匹配了直接忽略
    const technicianTimeList = []
    let relativeTimeStartAndDelay = new Date('3000-1-1')
    for (let tech of this.tempTechnicianList) {
      // debugger
      let relativeTimeStart = new Date(
        Math.max(this.getDateNow(), tech.lastClock.relativeTime)
      )
      if (relativeTimeStart > relativeTimeStartAndDelay) break
      let matchProjectItem = this.matchProject({
        tech,
        waitingProjectList: [projectItem]
      })
      if (matchProjectItem) {
        technicianTimeList.push(matchProjectItem)
        let relativeTimeStartAndDelayThis = new Date(
          matchProjectItem.relativeTimeStart.getTime() +
            matchProjectItem.delayTime * 60 * 1000
        )
        if (relativeTimeStartAndDelay > relativeTimeStartAndDelayThis) {
          relativeTimeStartAndDelay = relativeTimeStartAndDelayThis
        }
      }
    }
    if (technicianTimeList.length <= 0) {
      console.log('没有找到匹配的技师')
      this.data.unmatchOrderList.push({
        order,
        waitingProjectList: [projectItem]
      })
      return
    }
    // 按相对时间排序（因为小项不过单）如果时间一样，小项优先级最低的做，其他优先级高的做
    technicianTimeList.sort((a, b) => {
      // 由前到后的排序时间
      let timeA = a.relativeTimeStart.getTime() + a.delayTotal * 60 * 1000
      let timeB = b.relativeTimeStart.getTime() + b.delayTotal * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + a.delayTotal * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + b.delayTotal * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由后到前' &&
        b.projectItem.kind.orderRule == '由后到前'
      ) {
        // let diff = b.tech.lastClock.relativeTime - a.tech.lastClock.relativeTime
        let diff = this.compareLastClock(b.tech, a.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由前到后' &&
        b.projectItem.kind.orderRule == '由前到后'
      ) {
        // let diff = a.tech.lastClock.relativeTime - b.tech.lastClock.relativeTime
        let diff = this.compareLastClock(a.tech, b.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }
      if (timeDif == 0) return this.compareString(a.tech.name, b.tech.name)
      return timeDif
    })
    this.assignItem(technicianTimeList[0], order)
  },
  preAssignAdvanceOrder({ order, projectItem, timeStart }) {
    projectItem.projectPriorityTime = 0
    // 寻找匹配技能的技师，如果上次结束时间太晚，就没必要匹配了直接忽略
    let freeTechnicianTimeList = []
    const busyTechnicianTimeList = []
    // 判断技师到时候有没有空，需不需要等待提前计算的项目
    const earliesTimeStart = new Date(Math.max(this.getDateNow(), timeStart))
    for (let tech of this.tempTechnicianList) {
      // debugger
      // if (order.name == '指定技师' && tech.name == 'Mike') debugger
      let matchProjectItem = this.matchProject({
        advanceTimeStart: timeStart,
        tech,
        waitingProjectList: [projectItem]
      })
      if (matchProjectItem) {
        if (earliesTimeStart < matchProjectItem.relativeTimeStart) {
          busyTechnicianTimeList.push(matchProjectItem)
        } else {
          freeTechnicianTimeList.push(matchProjectItem)
        }
      }
    }
    freeTechnicianTimeList = freeTechnicianTimeList.filter(
      x => !this.data.advancTechIDList.includes(x.tech.id)
    )
    if (freeTechnicianTimeList.length > 0) {
      let canAssign = this.judgeAdvanceAssign({
        order,
        ...freeTechnicianTimeList[0],
        timeStart: earliesTimeStart,
        technicians: freeTechnicianTimeList.map(m => m.tech.id)
      })
      if (canAssign) {
        return
      }
    }
    // 按相对时间排序（因为小项不过单）如果时间一样，小项优先级最低的做，其他优先级高的做
    busyTechnicianTimeList.sort((a, b) => {
      // 由前到后的排序时间
      let timeA = a.relativeTimeStart.getTime() + a.delayTotal * 60 * 1000
      let timeB = b.relativeTimeStart.getTime() + b.delayTotal * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + a.delayTotal * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + b.delayTotal * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由后到前' &&
        b.projectItem.kind.orderRule == '由后到前'
      ) {
        // let diff = b.tech.lastClock.relativeTime - a.tech.lastClock.relativeTime
        let diff = this.compareLastClock(b.tech, a.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }

      if (
        timeDif == 0 &&
        a.projectItem.kind.orderRule == '由前到后' &&
        b.projectItem.kind.orderRule == '由前到后'
      ) {
        // let diff = a.tech.lastClock.relativeTime - b.tech.lastClock.relativeTime
        let diff = this.compareLastClock(a.tech, b.tech)
        if (diff == 0) return this.compareString(a.tech.name, b.tech.name)
        return diff
      }
      if (timeDif == 0) return this.compareString(a.tech.name, b.tech.name)
      return timeDif
    })
    for (let techItem of busyTechnicianTimeList) {
      let canAssign = this.judgeAdvanceAssign(
        {
          order,
          ...techItem,
          timeStart: earliesTimeStart,
          technicians: [techItem.tech.id]
        },
        techItem.tech.id
      )
      if (canAssign) {
        return
      }
    }
    // 无法匹配
    // console.log('无法匹配')
    // this.data.unmatchOrderList.push({ order, waitingProjectList: [projectItem] })
  },
  getDuration({ tech, projectItem }) {
    let duration = 0
    let durationDiff = 0
    try {
      duration = projectItem.project.standardTime || 0
      for (let add of projectItem.additions) {
        duration += add.standardTime || 0
      }
      durationDiff = tech.skillInfo[projectItem.project.id].timeDiff || 0
      for (let add of projectItem.additions) {
        durationDiff += tech.skillInfo[add.id].timeDiff || 0
      }
    } catch (e) {
      console.log('技师和项目不匹配')
    }
    return duration + durationDiff
  },
  // 计算价格和提成
  getAccountAndCommission({ tech, projectItem }) {
    let rObj = {
      project: {
        id: projectItem.project.id,
        name: projectItem.project.name,
        englishName: projectItem.project.englishName,
        price: projectItem.project.price || 0,
        // commissionPercentage: 0, // 提成比例 % 现在改成金额
        commissionAccount: projectItem.project.commision || 0 // 提成金额
      },
      additions: [],
      commissionAccountTotal: 0,
      accountTotal: projectItem.project.price || 0
    }
    let skillProject = tech.skillInfo[projectItem.project.id]
    if (
      skillProject &&
      skillProject.commisionDiff &&
      !isNaN(skillProject.commisionDiff)
    ) {
      // 比例改成金额
      rObj.project.commissionAccount += skillProject.commisionDiff || 0
    }
    rObj.commissionAccountTotal = rObj.project.commissionAccount

    projectItem.additions.forEach(a => {
      let addition = {
        id: a.id,
        name: a.name,
        englishName: a.englishName,
        price: a.price || 0,
        // commissionPercentage: 0,
        commissionAccount: a.commision || 0
      }
      rObj.accountTotal += addition.price
      let skillProject = tech.skillInfo[a.id]
      if (
        skillProject &&
        skillProject.commisionDiff &&
        !isNaN(skillProject.commisionDiff)
      ) {
        addition.commissionAccount += skillProject.commisionDiff || 0
      }
      rObj.commissionAccountTotal += addition.commissionAccount
      rObj.additions.push(addition)
    })
    return rObj
  },
  assignItem(matchProjectItem, order, isAdvanceCalculation) {
    let lastNumber = 0
    for (let item of order.orderInfo) {
      const itemNumber = item.number || 0
      if (lastNumber < itemNumber) lastNumber = itemNumber
    }

    // 计算技师时调
    let isAdvance = false
    if (isAdvanceCalculation) {
      isAdvance = true
    } else if (
      matchProjectItem.projectItem.project.do ||
      matchProjectItem.projectItem.technicians.length > 0
    ) {
      isAdvance = true
    }
    // 计算价钱和技师提成
    const accountAndCommission = this.getAccountAndCommission(matchProjectItem)

    const item = {
      accountAndCommission,
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
        matchProjectItem.tech.fixedTableList.includes(
          matchProjectItem.projectItem.project.workingTableID
        ),
      timeStartStr: this.getTimeStr(matchProjectItem.timeStart),
      timeStart: matchProjectItem.timeStart,
      timeEndStr: this.getTimeStr(matchProjectItem.timeEnd),
      timeEnd: matchProjectItem.timeEnd,
      duration: matchProjectItem.duration,
      status: isAdvanceCalculation ? 'advance' : 'waiting',
      delayTime: matchProjectItem.delayTime,
      isAdvance
    }
    if (!isAdvance) {
      const hasEx = this.hasExchangeProject(item, order)
      if (hasEx) return
    }

    this.data.preAssignList.push(item)

    // 更改技师的最后完成时间
    const tech = this.tempTechnicianList.find(x => x.id == item.techID)
    let time = item.timeEnd
    if (item.orderRule != '由后到前') {
      tech.lastClock.relativeTime = item.timeEnd
      tech.lastClock.relativeTimeStr = item.timeEndStr
    }
    if (
      item.timeStartStr <= tech.attendanceInfo.lunchTime &&
      item.timeEndStr > tech.attendanceInfo.lunchTime
    ) {
      time = new Date(
        time.getTime() + tech.attendanceInfo.lunchTimeDuration * 60 * 1000
      )
      tech.lastClock.relativeTime = time
      tech.lastClock.relativeTimeStr = this.getTimeStr(time)
    }

    tech.lastClock.time = time
    tech.lastClock.timeStr = this.getTimeStr(time)
    tech.lastClock.assignID = item.id

    // 更新排序
    this.tempTechnicianList.sort((a, b) => {
      // let diff = a.lastClock.relativeTime - b.lastClock.relativeTime
      let diff = this.compareLastClock(a, b)
      if (diff == 0) return this.compareString(a.name, b.name)
      return diff
    })
  },
  // 第一个排钟表时间是否大于第二个
  isGreater(timePositionA, timePositionB) {
    if (timePositionA.time > timePositionB.time) {
      return true
    }
    if (timePositionA.time < timePositionB.time) {
      return false
    }
    return timePositionA.index > timePositionB.index
  },
  hasExchangeProject(item, order) {
    // preAssignItem增加字段 delayTime isAdvance.tech lastclock 增加tech.lastClock.assignID
    const exchangeList = []

    for (let p of this.data.preAssignList) {
      if (p.isAdvance) break
      const pOrder = this.data.orderObj[p.orderID]
      if (!pOrder) break
      // 如果已排的项目有开始时间晚于当前项目并且订单时间早于当前项目
      if (
        p.timeStart > item.timeStart &&
        this.isGreater(order.timePositions[0], pOrder.timePositions[0])
      ) {
        // 先来先做，如果技师能做的话
        const result = this.findExchangeProjectItem({
          reAssignItem: p,
          changeItem: item,
          p
        })

        if (result) {
          exchangeList.push(result)
        }
      } else if (
        p.timeStart < item.timeStart &&
        this.isGreater(pOrder.timePositions[0], order.timePositions[0])
      ) {
        // 如果已排的项目有开始时间早于当前项目并且订单时间晚于当前项目
        const result = this.findExchangeProjectItem({
          reAssignItem: item,
          changeItem: p,
          p
        })

        if (result) {
          exchangeList.push(result)
          // findItem = true
        }
      }
    }

    if (exchangeList.length > 0) {
      exchangeList.sort((a, b) => {
        if (a.changeItem.timeStart == b.changeItem.timeStart) {
          return a.reAssignFirstTimePosition - b.reAssignFirstTimePosition
        }
        return a.changeItem.timeStart - b.changeItem.timeStart
      })
      const exchangeItem = exchangeList[0]
      // 分别分配项目 要计算工作台限制和午餐时间 先看看两个项目的主力后备时间
      this.assignExchangeItem(exchangeItem)
      return true
    }
    return false
  },
  findExchangeProjectItem({ reAssignItem, changeItem, p }) {
    // 两个项目必须是所在技师的最后项目， 先看看changeItem和reAssignItem 互换技师能不能做，然后比较delayTime，两个delaytime都不能变大，然后找到reAssignFirstTimePosition。最后返回
    // 必须是技师的最后一个项目才考虑交换
    const pTech = this.tempTechnicianList.find(x => x.id == p.techID)
    if (!pTech || pTech.lastClock.assignID != p.id) return false

    const reAssignOrder = this.data.orderObj[reAssignItem.orderID]
    const changeOrder = this.data.orderObj[changeItem.orderID]
    const reAssignTech = this.tempTechnicianList.find(
      x => x.id == reAssignItem.techID
    )
    const changeTech = this.tempTechnicianList.find(
      x => x.id == changeItem.techID
    )
    if (!reAssignOrder || !changeOrder || !reAssignTech || !changeTech) {
      return false
    }
    // 判断changeTech能不能做reAssignOrder
    const reAssignProject = this.matchExchangeProject({
      timeStart: changeItem.timeStart,
      relativeTimeStart: changeItem.relativeTimeStart,
      tech: changeTech,
      waitingProjectList: reAssignOrder.orderInfo
        .filter(x => x.assignItemID == null)
        .sort((x, y) => x.kind.priority - y.kind.priority)
    })
    if (!reAssignProject) return false
    // 换过来的主力后备时间不能变多
    if (reAssignProject.delayTime > changeItem.delayTime) return false
    // 判断reAssignTech能不能做changeOrder
    const changeProject = this.matchExchangeProject({
      timeStart: reAssignItem.timeStart,
      relativeTimeStart: reAssignItem.relativeTimeStart,
      tech: reAssignTech,
      waitingProjectList: changeOrder.orderInfo
        .filter(x => x.assignItemID == null)
        .sort((x, y) => x.kind.priority - y.kind.priority)
    })
    if (!changeProject) return false
    // 换过来的主力后备时间不能变多
    if (changeProject.delayTime > reAssignItem.delayTime) return false
    // 未完待续
    const rObj = {
      ...arguments[0],
      changeProject,
      reAssignProject,
      reAssignFirstTimePosition: reAssignOrder.timePositions[0].time
    }
    return rObj
  },
  assignExchangeItem({
    reAssignItem,
    changeItem,
    p,
    changeProject,
    reAssignProject,
    reAssignFirstTimePosition
  }) {
    // debugger
    this.data.preAssignList = this.data.preAssignList.filter(
      x => x.id != reAssignItem.id && x.id != changeItem.id
    )
    this.assignItem(reAssignProject, this.data.orderObj[reAssignItem.orderID])
    this.assignItem(changeProject, this.data.orderObj[changeItem.orderID])
  },
  matchExchangeProject({
    timeStart,
    relativeTimeStart,
    tech,
    waitingProjectList
  }) {
    let matchProjectObj = {
      tech,
      timeStart,
      relativeTimeStart,
      delayTotal: 999999
    } // projectID  projectPriorityTime delayTime type
    const list = []
    waitingProjectList.forEach(projectItem => {
      if (projectItem.technicians.length > 0) {
        let hasTech = projectItem.technicians.find(i => i.id == tech.id)
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
        if (
          tech.skillInfo[projectItem.project.id] &&
          tech.skillInfo[projectItem.project.id].type
        ) {
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
            if (typeList.find(i => i == 'sub')) {
              delayTime = parseInt(localStorage.subTime)
              type = 'sub'
            } else if (typeList.find(i => i == 'minor')) {
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
      const exchangeProject = list.sort(
        (a, b) =>
          a.timeStart.getTime() +
          a.delayTotal * 60 * 1000 -
          b.timeStart.getTime() -
          b.delayTotal * 60 * 1000
      )[0]
      if (timeStart >= exchangeProject.timeStart) {
        return exchangeProject
      }
    }
    return false
  },
  matchProject({
    tech,
    waitingProjectList,
    advanceTimeStart = new Date(0),
    relativeAdvanceTimeStart = new Date(0)
  }) {
    let timeStart = new Date(
      Math.max(this.getDateNow(), tech.lastClock.time, advanceTimeStart)
    )
    let relativeTimeStart = new Date(
      Math.max(
        this.getDateNow(),
        tech.lastClock.relativeTime,
        relativeAdvanceTimeStart
      )
    )
    let matchProjectObj = {
      tech,
      timeStart,
      relativeTimeStart,
      delayTotal: 999999
    } // projectID  projectPriorityTime delayTime type
    const list = []
    waitingProjectList.forEach(projectItem => {
      if (projectItem.technicians.length > 0) {
        let hasTech = projectItem.technicians.find(i => i.id == tech.id)
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
        if (
          tech.skillInfo[projectItem.project.id] &&
          tech.skillInfo[projectItem.project.id].type
        ) {
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
            if (typeList.find(i => i == 'sub')) {
              delayTime = parseInt(localStorage.subTime)
              type = 'sub'
            } else if (typeList.find(i => i == 'minor')) {
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
        (a, b) =>
          a.timeStart.getTime() +
          a.delayTotal * 60 * 1000 -
          b.timeStart.getTime() -
          b.delayTotal * 60 * 1000
      )[0]
    }
    return false
  },
  getWorkingTableTimeStartObj({
    tech,
    projectItem,
    timeStart,
    relativeTimeStart,
    delayTotal
  }) {
    const rObj = { ...arguments[0] }

    // 判断是否是午餐时间
    const lunchTimeStart = this.getTimeByStr(tech.attendanceInfo.lunchTime)
    const lunchTimeEnd = new Date(
      lunchTimeStart.getTime() +
        tech.attendanceInfo.lunchTimeDuration * 60 * 1000
    )
    if (timeStart >= lunchTimeStart && timeStart < lunchTimeEnd) {
      rObj.timeStart = lunchTimeEnd
      // 午餐时间过单
      rObj.relativeTimeStart = rObj.timeStart
      return this.getWorkingTableTimeStartObj(rObj)
    }

    const duration = this.getDuration({ tech, projectItem })
    rObj.duration = duration
    const fixedTableList = tech.fixedTableList || []
    let timeEnd = new Date(timeStart.getTime() + duration * 60 * 1000)
    rObj.timeEnd = timeEnd
    const workingTableID = projectItem.project.workingTableID
    if (workingTableID && !fixedTableList.includes(workingTableID)) {
      const workingTableItem = this.workingTableList.find(
        x => x.id == workingTableID
      )
      if (workingTableItem && workingTableItem.count > 0) {
        let fixCount = this.data.technicianList.filter(x => {
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
            p =>
              p.workingTableID == workingTableID &&
              p.techID != tech.id &&
              !p.fixedTable &&
              !(p.timeStart >= timeEnd || p.timeEnd <= timeStart)
          )
        const countSet = new Set(matchPreAssignList.map(m => m.techID))
        if (countSet.size >= freeCount) {
          matchPreAssignList.sort((a, b) => a.timeEnd - b.timeEnd)
          if (matchPreAssignList.length <= freeCount) {
            rObj.timeStart = new Date(matchPreAssignList[0].timeEnd)
          } else {
            rObj.timeStart = new Date(
              matchPreAssignList[matchPreAssignList.length - freeCount].timeEnd
            )
          }

          rObj.relativeTimeStart = rObj.timeStart
          rObj.timeEnd = new Date(
            rObj.timeStart.getTime() + duration * 60 * 1000
          )
          return this.getWorkingTableTimeStartObj(rObj)
        }
      }
    }
    return rObj
  },
  advanceCalculation(advanceList) {
    for (let advanceItem of advanceList) {
      // debugger
      this.preAssignAdvanceOrder(advanceItem)
    }
    console.log(this.data.advancTechIDList, this.data.advancMultiList)
  },
  // 判断普通的项目是否影响 提前计算 的项目
  judgeAssign(techItem) {
    let isExisted = this.data.advancTechIDList.includes(techItem.tech.id)
    if (isExisted) return false
    if (this.data.advancMultiList.length <= 0) return true
    let advancMultiListClone = this.clone(this.data.advancMultiList)
    advancMultiListClone.forEach(x => {
      let timeStart = new Date(Math.max(x.timeStart, this.getDateNow()))
      // 找到被影响的项目，去掉技师，然后看看能不能排开
      if (techItem.timeEnd > timeStart) {
        x.technicians = x.technicians.filter(f => f != techItem.tech.id)
      }
    })
    if (this.techAssign(advancMultiListClone)) {
      this.data.advancMultiList = advancMultiListClone
      return true
    }
    return false
  },
  judgeAdvanceAssign(techItem, techID) {
    if (techID) {
      let isExisted = this.data.advancTechIDList.includes(techID)
      if (isExisted) return false
    }

    const newAdvancMultiList = [...this.data.advancMultiList, techItem]
    if (this.techAssign(newAdvancMultiList)) {
      if (techID) {
        this.data.advancTechIDList.push(techID)
      } else {
        this.data.advancMultiList = newAdvancMultiList
      }
      return true
    }
    return false
  },
  techAssign(data, index = 0, assignList = []) {
    const item = data[index]
    for (let techID of item.technicians) {
      if (!assignList.find(x => x.techID == techID)) {
        if (index == data.length - 1) {
          return assignList.concat([{ item, techID: techID }])
        }
        let r = this.techAssign(
          data,
          index + 1,
          assignList.concat([{ item, techID: techID }])
        )
        if (r) return r
      }
    }
    return false
  },
  // findUnAssignSet(data) {
  //   for (let i = 1; i < data.length; i++) {
  //     for (let item of this.getGroupByCount(data, i)) {
  //       let subList = []
  //       for (let dataItem of data) {
  //         if (this.isSubSet(item, dataItem.technicians)) {
  //           subList.push(dataItem)
  //           if (subList.length > item.length) {
  //             return item
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return false
  // },
  // isSubSet(set, subSet) {
  //   try {
  //     return subSet.every((x) => set.includes(x))
  //   } catch (e) {
  //     return false
  //   }
  // },
  // getGroupByCount(data, size, result = [], allResult = []) {
  //   // debugger
  //   if (size > data.length) {
  //     return
  //   }
  //   if (size == data.length) {
  //     let newResult = [...result]
  //     data.forEach((e) => newResult.push(...e.technicians))
  //     allResult.push([...new Set(newResult)])
  //   } else {
  //     for (let i = 0; i < data.length; i++) {
  //       let newResult = [...new Set([...result, ...data[i].technicians])]
  //       if (size == 1) {
  //         allResult.push(newResult)
  //       } else {
  //         let newArr = [...data]
  //         newArr.splice(0, i + 1)
  //         this.getGroupByCount(newArr, size - 1, newResult, allResult)
  //       }
  //     }
  //   }
  //   return allResult
  // },
  getOrder() {
    const doAdvanceTime = parseInt(localStorage.doAdvanceTime)
    const designatedTechAdvanceTime = parseInt(
      localStorage.designatedTechAdvanceTime
    )
    const doDelayTime = parseInt(localStorage.doDelayTime)
    const designatedTechDelayTime = parseInt(
      localStorage.designatedTechDelayTime
    )

    const orderList = []
    const advanceNowList = []
    const advanceList = []
    const dataTimeNow = this.getDateNow()
    Object.keys(this.data.orderObj).forEach(x => {
      let order = this.data.orderObj[x]

      // #region 找到必做提前计算
      let waitingProjectList = order.orderInfo
        .filter(x => x.assignItemID == null)
        .sort((x, y) => x.kind.priority - y.kind.priority)
      let index = waitingProjectList.findIndex(
        y => y.project.do || y.technicians.length > 0
      )
      if (index >= 0) {
        let number = index + order.orderInfo.length - waitingProjectList.length
        let timeDiff = order.timePositions[number].time - dataTimeNow
        if (
          (waitingProjectList[index].project.do &&
            timeDiff <= doAdvanceTime * 60 * 1000) ||
          (waitingProjectList[index].technicians.length > 0 &&
            timeDiff <= designatedTechAdvanceTime * 60 * 1000)
        ) {
          if (order.isArrive == 'arrive' && order.isfree) {
            advanceNowList.push({
              order,
              projectItem: waitingProjectList[index]
            })
          } else {
            // 设置推后时间
            let delayMinutes = designatedTechDelayTime
            if (waitingProjectList[index].project.do) {
              delayMinutes = doDelayTime
            }
            // 提前计算的项目开始时间延迟 designatedTechDelayTime || doDelayTime
            let timeStart = new Date(
              order.timePositions[number].time.getTime() +
                delayMinutes * 60 * 1000
            )
            // 如果客户到场正在做别的项目，设置开始时间等于正在做的项目的结束时间
            if (order.isArrive == 'arrive' && !order.isfree) {
              let timeEndList = this.data.assignList
                .filter(x => x.orderID == order.id)
                .map(m => m.timeEnd)
              timeEndList.length > 0 &&
                (timeStart = new Date(Math.max(...timeEndList)))
            }
            advanceList.push({
              order,
              projectItem: waitingProjectList[index],
              timeStart
            })
          }
          return
        }
      }
      // #endregion

      // 找到正常排队的订单
      if (order.isArrive == 'arrive' && order.isfree) {
        orderList.push(order)
      }
    })

    orderList.sort((x, y) => {
      let pX = x.timePositions[0]
      let pY = y.timePositions[0]
      if (pX.time.getTime() == pY.time.getTime()) {
        return pX.index - pY.index
      }
      return pX.time - pY.time
    })
    advanceNowList.sort((x, y) => {
      let pX = x.order.timePositions[0]
      let pY = y.order.timePositions[0]
      if (pX.time.getTime() == pY.time.getTime()) {
        return pX.index - pY.index
      }
      return pX.time - pY.time
    })

    advanceList.sort((x, y) => {
      let pX = x.order.timePositions[0]
      let pY = y.order.timePositions[0]
      if (x.timeStart.getTime() == y.timeStart.getTime()) {
        return pX.index - pY.index
      }
      return x.timeStart - y.timeStart
    })
    console.log({ orderList, advanceNowList, advanceList })
    return { orderList, advanceNowList, advanceList }
  },
  endAssignItem(assignItem) {
    assignItem.status = 'end'

    // 项目结束时，不修改完成时间，项目完成时间在项目开始的时候就已经确定
    // assignItem.timeEnd = new Date(Math.max(this.getDateNow(), assignItem.timeEnd))
    // assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
    assignItem.realTimeEnd = this.getDateNow()
    assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)

    const order = this.data.orderObj[assignItem.orderID]
    if (order.orderInfo.find(x => x.assignItemID == null)) {
      order.isfree = true
    }
    // 在order.orderInfo中记录项目状态
    const orderItem = order.orderInfo.find(
      x => x.project.id == assignItem.projectID
    )
    if (orderItem) {
      orderItem.status = assignItem.status
    }
    // 更改技师最后完成时间
    let tech = this.setTechLastClock(assignItem)
    // 保存技师最后完成时间到数据库
    this.saveTechLastClock(tech)
    this.assign()
    this.saveScheduleData()

    window.algDataChange.assignItemChange()
  },
  async saveTechLastClock(tech) {
    let techDB = await window.IDB.get('technician', tech.id)
    if (techDB) {
      techDB.lastEndClock = tech.lastClock
      window.IDB.put('technician', techDB)
    }
  },
  startAssignItem(assignItem) {
    if (
      this.data.assignList.find(
        x => x.techID == assignItem.techID && x.status == 'start'
      )
    ) {
      throw new Error('该技师已经有开始的项目，无法分配！')
    }
    assignItem.status = 'start'

    assignItem.timeStart = new Date(
      Math.max(this.getDateNow(), assignItem.timeStart)
    )
    assignItem.timeStartStr = this.getTimeStr(assignItem.timeStart)
    assignItem.timeEnd = new Date(
      assignItem.timeStart.getTime() + assignItem.duration * 60 * 1000
    )
    assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
    // 记录真实时间
    assignItem.realTimeStart = this.getDateNow()
    assignItem.realTimeStartStr = this.getTimeStr(assignItem.realTimeStart)
    assignItem.realTimeEnd = new Date(
      assignItem.realTimeStart.getTime() + assignItem.duration * 60 * 1000
    )
    assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)
    // 在order.orderInfo中记录项目状态
    const orderItem = this.data.orderObj[assignItem.orderID].orderInfo.find(
      x => x.project.id == assignItem.projectID
    )
    if (orderItem) {
      orderItem.status = assignItem.status
    }
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()

    window.algDataChange.assignItemChange()
  },
  cancelAssignItem(assignItem, index) {
    try {
      this.data.assignList.splice(index, 1)
      const order = this.data.orderObj[assignItem.orderID]
      order.isfree = true
      const orderInfoItem = order.orderInfo.find(
        x => x.project.id == assignItem.projectID
      )
      orderInfoItem.assignItemID = null
      delete orderInfoItem.number
      delete orderInfoItem.status
    } finally {
      const tech = this.data.technicianList.find(x => x.id == assignItem.techID)
      if (tech) {
        this.computingTechLastClock(tech)
        // 更新排序
        this.data.technicianList.sort((a, b) => {
          // let diff = a.lastClock.relativeTime - b.lastClock.relativeTime
          let diff = this.compareLastClock(a, b)
          if (diff == 0) return this.compareString(a.name, b.name)
          return diff
        })
      }
      this.assign()
      this.saveScheduleData()

      window.algDataChange.assignListChange()
    }
  },
  manuallyUnshiftToAssignList(assignItem) {
    assignItem.realTimeStart = assignItem.timeStart
    assignItem.realTimeStartStr = assignItem.timeStartStr
    assignItem.realTimeEnd = assignItem.timeEnd
    assignItem.realTimeEndStr = assignItem.timeEndStr

    this.data.assignList.unshift(assignItem)
    this.data.orderObj[assignItem.orderID].isfree = false
    const orderItem = this.data.orderObj[assignItem.orderID].orderInfo.find(
      x => x.project.id == assignItem.projectID
    )
    orderItem.number = assignItem.number
    orderItem.assignItemID = assignItem.id
    orderItem.status = assignItem.status
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()

    window.algDataChange.assignListChange()
  },
  unshiftToAssignList(assignItem, status, index) {
    if (status == 'start') {
      if (
        this.data.assignList.find(
          x => x.techID == assignItem.techID && x.status == 'start'
        )
      ) {
        throw new Error('该技师已经有开始的项目，无法分配！')
      }
      assignItem.timeStart = new Date(
        Math.max(this.getDateNow(), assignItem.timeStart)
      )
      assignItem.timeStartStr = this.getTimeStr(assignItem.timeStart)
      assignItem.timeEnd = new Date(
        assignItem.timeStart.getTime() + assignItem.duration * 60 * 1000
      )
      assignItem.timeEndStr = this.getTimeStr(assignItem.timeEnd)
      // 记录真实时间
      assignItem.realTimeStart = this.getDateNow()
      assignItem.realTimeStartStr = this.getTimeStr(assignItem.realTimeStart)
      assignItem.realTimeEnd = new Date(
        assignItem.realTimeStart.getTime() + assignItem.duration * 60 * 1000
      )
      assignItem.realTimeEndStr = this.getTimeStr(assignItem.realTimeEnd)
    } else if (status == 'fix') {
      assignItem.realTimeStart = assignItem.timeStart
      assignItem.realTimeStartStr = assignItem.timeStartStr
      assignItem.realTimeEnd = assignItem.timeEnd
      assignItem.realTimeEndStr = assignItem.timeEndStr
    }
    this.data.preAssignList.splice(index, 1)
    assignItem.status = status

    this.data.assignList.unshift(assignItem)
    this.data.orderObj[assignItem.orderID].isfree = false
    const orderItem = this.data.orderObj[assignItem.orderID].orderInfo.find(
      x => x.project.id == assignItem.projectID
    )
    orderItem.number = assignItem.number
    orderItem.assignItemID = assignItem.id
    orderItem.status = status
    // 更改技师最后完成时间
    this.setTechLastClock(assignItem)
    this.assign()
    this.saveScheduleData()

    // socket.io 数据变化 出发事件
    window.algDataChange.assignListChange()
    // orderObj
  },
  setTechLastClock(assignItem) {
    const tech = this.data.technicianList.find(x => x.id == assignItem.techID)
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
      time = new Date(
        time.getTime() + tech.attendanceInfo.lunchTimeDuration * 60 * 1000
      )
      tech.lastClock.relativeTime = time
      tech.lastClock.relativeTimeStr = this.getTimeStr(time)
    }

    tech.lastClock.time = time
    tech.lastClock.timeStr = this.getTimeStr(time)
    tech.lastClock.assignID = assignItem.id
    // 更新排序
    this.data.technicianList.sort((a, b) => {
      // let diff = a.lastClock.relativeTime - b.lastClock.relativeTime
      let diff = this.compareLastClock(a, b)
      if (diff == 0) return this.compareString(a.name, b.name)
      return diff
    })

    return tech
  },
  async initData() {
    // refresh Date
    let nextDateMS =
      new Date(new Date().toDateString()).setHours(24) - new Date().getTime()
    setTimeout(async () => {
      await this.initData()
      console.log('initData')
      window.algDataChange.scheduleDataChange()
    }, nextDateMS)

    this.data.orderObj = {}
    this.data.positionObj = { maxIndex: 0 }
    this.data.technicianList = []
    this.data.assignList = []
    this.data.timeList = []
    this.data.preAssignList = []
    this.advancTechIDList = []
    this.advancMultiList = []
    this.remainOrderList = []

    await this.getScheduleData()
    await this.getTechnicianList()
    await this.getWorkingTable()
    this.assign()
  },
  getTimeByStr(timeStr) {
    const hour = parseInt(timeStr.split(':')[0])
    const minute = parseInt(timeStr.split(':')[1])
    // return new Date(
    //   this.getDateStart().getTime() + (hour * 60 + minute) * 60 * 1000
    // )
    return this.setTimeHoursAndMinutes(this.getDateStart(), hour, minute)
  },
  setTimeHoursAndMinutes(time, hours = 0, minutes = 0) {
    if (!(time instanceof Date)) {
      time = new Date(time)
      if (time == 'Invalid Date') {
        throw new Error('setTimeHours 时间参数格式不正确！')
      }
    }
    time = new Date(time.toDateString())
    let date = new Date(time.setHours(hours))
    date = new Date(date.setMinutes(minutes))
    return date
  },
  getTimeStr(time) {
    if (time instanceof Date) {
      return time.toLocaleTimeString('en-GB').replace(/:00$/, '')
    }
    return ''
  },
  clone(obj) {
    return JSON.parse(JSON.stringify(obj), (k, v) => {
      if (
        typeof v == 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)
      ) {
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

    // setInterval(() => {
    //   window.algorithm.timeDuration += 1000 * 60
    //   this.assignpProjects()
    // }, 1000 * 60)

    Object.defineProperty(Vue.prototype, '$clone', {
      get() {
        return obj => {
          return JSON.parse(JSON.stringify(obj), (k, v) => {
            if (
              typeof v == 'string' &&
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)
            ) {
              return new Date(v)
            }
            return v
          })
        }
      }
    })

    Object.defineProperty(Vue.prototype, '$fixNum', {
      get() {
        return num => {
          return Math.round(num * 1000000) / 1000000
        }
      }
    })

    Object.defineProperty(Vue.prototype, '$getNewID', {
      get() {
        const pn = performance.now()
        const time = new Date().getTime()
        const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(
          0,
          3
        )
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
