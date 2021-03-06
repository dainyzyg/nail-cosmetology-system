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
    const promiseList = []
    orderList.forEach((orderItem) => {
      orderItem.orderInfo.forEach((orderInfoItem) => {
        promiseList.push(this.getStandardTime(orderInfoItem))
      })
    })
    await Promise.all(promiseList)
    return orderList
  },
  async getStandardTime(orderInfoItem) {
    const promiseList = [window.IDB.get('project', orderInfoItem.project.id)]
    orderInfoItem.additions.forEach((addItem) => {
      promiseList.push(window.IDB.get('addition', addItem.id))
    })
    const promiseResult = await Promise.all(promiseList)
    orderInfoItem.standardTimeAll = promiseResult.reduce((accumulator, currentValue) => {
      let standardTime = 0
      if (currentValue && currentValue.standardTime) {
        standardTime = currentValue.standardTime
      }
      return accumulator + standardTime
    }, 0)
  },
  async getAssignList() {
    const dateBegin = this.getDateStart()
    const assignList = await window.IDB.get('assignList', dateBegin)
    return assignList
  },
  async getPreAssignList() {
    const preAssignList = []
    const dateBegin = this.getDateStart()
    await window.IDB.executeTransaction(['assign'], 'readonly', (t) => {
      const store = t.objectStore('assign')
      const request = store.index('date').openCursor(IDBKeyRange.only(dateBegin))
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          preAssignList.push(cursor.value)
          cursor.continue()
        }
      }
    })
    return preAssignList
  },
  async assignpProjects() {
    console.time('assignpProjects')
    await this.initWorkingTableLimit()
    const technicianList = await this.getTechnicianList()
    const technicianListSort = []
    technicianList.forEach((i) => {
      technicianListSort.push({
        technician: i,
        startTime: i.lastWorkTime || new Date(0)
      })
    })
    const orderList = await this.getOrder()
    const preAssignList = await this.getPreAssignList()

    orderList.sort((a, b) => {
      if (a.orderDate.getTime() - b.orderDate.getTime() == 0) {
        const standardTimeA = a.orderInfo.reduce((accumulator, currentValue) => {
          const standardTime = currentValue.standardTimeAll || 0
          return accumulator + standardTime
        }, 0)
        const standardTimeB = b.orderInfo.reduce((accumulator, currentValue) => {
          const standardTime = currentValue.standardTimeAll || 0
          return accumulator + standardTime
        }, 0)
        return standardTimeA - standardTimeB
      }
      return a.orderDate.getTime() - b.orderDate.getTime()
    })
    console.time('a')
    const r = this.assign({
      technicianList: technicianListSort,
      orderList: orderList,
      level: 1,
      preAssignList: preAssignList,
      workListObj: {}
    })
    const assignList = {
      preAssignList: this.counts(r.preAssignList),
      technicianList,
      historyPreAssignList: r.historyPreAssignList,
      date: this.getDateStart(),
      dateNow: this.getDateNow(),
      historyLevel: r.historyLevel
    }
    await window.IDB.put('assignList', assignList)
    ipcRenderer.send('asynchronous-message', preAssignList)
    console.timeEnd('assignpProjects')
    console.log(r)
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
  assign({
    technicianList,
    orderList,
    level,
    preAssignList,
    workListObj,
    historyPreAssignList,
    historyItems,
    doDelayProjectList
  }) {
    historyItems = historyItems || {}
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
        historyItems,
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
    return { preAssignList, state: 'complete', historyPreAssignList, historyLevel: level }
  },
  assignOrder({
    technicianList,
    orderList,
    orderItem,
    level,
    preAssignList,
    workListObj,
    historyPreAssignList,
    historyItems,
    doDelayProjectList
  }) {
    // if (Object.keys(historyPreAssignList).length == 91 && orderItem.name == '1128-1') {
    //   debugger
    // }
    // if (Object.keys(historyPreAssignList).length == 180) {
    //   return { preAssignList, state: 'complete', historyPreAssignList }
    // }
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
    if (notAssignProject.length == 0) {
      return { state: 'continue' }
    }
    if (Object.keys(historyPreAssignList).length == 130) {
      debugger
    }
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
          historyPreAssignList,
          historyItems
        })
        if (r.state == 'fail' && r.level == level) {
          continue
        } else {
          return r
        }
      }

      if (orderMatchPreAssignList.find((x) => x.projectID == TechnicianTimeItem.projectItem.project.id)) {
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
              technicianList,
              orderList,
              workListObj,
              prevProjectEndTime,
              orderItem,
              TechnicianTimeItem,
              level,
              preAssignList,
              historyPreAssignList,
              historyItems,
              doDelayProjectList
            })
            if (assignItemResult.complete) {
              return assignItemResult
            }
            if (assignItemResult.state == 'complete') {
              const r = this.assign({
                technicianList,
                orderList,
                level: level + 1,
                preAssignList: assignItemResult.preAssignList,
                workListObj,
                doDelayProjectList: [...doDelayProjectList],
                historyPreAssignList,
                historyItems
              })
              if (r.state == 'fail' && r.level == level) {
                continue
              } else {
                return r
              }
              // return this.assignOrder({
              //   orderList,
              //   technicianList,
              //   orderItem,
              //   level,
              //   preAssignList,
              //   workListObj,
              //   doDelayProjectList: [...doDelayProjectList],
              //   historyPreAssignList
              // })
            } else if (assignItemResult.state == 'fail') {
              return assignItemResult
            } else {
              const r = this.assign({
                technicianList,
                orderList,
                level: level + 1,
                preAssignList: assignItemResult.preAssignList,
                workListObj,
                doDelayProjectList: [...doDelayProjectList],
                historyPreAssignList,
                historyItems
              })
              if (r.state == 'fail' && r.level == level) {
                continue
              } else {
                return r
              }
            }
          } else {
            continue
          }
        }
        const newPreAssignList = this.reAssign({
          prevProjectEndTime,
          orderItem,
          TechnicianTimeItem,
          level,
          preAssignList,
          historyPreAssignList,
          historyItems,
          doDelayProjectList
        })
        if (!newPreAssignList) {
          continue
        } else if (newPreAssignList.state == 'fail') {
          return newPreAssignList
        }
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: newPreAssignList,
          workListObj,
          doDelayProjectList: [...doDelayProjectList],
          historyPreAssignList,
          historyItems
        })
        if (r.state == 'fail' && r.level == level) {
          continue
        } else {
          return r
        }
      }
      const assignItemResult = this.assignItem({
        technicianList,
        orderList,
        workListObj,
        prevProjectEndTime,
        orderItem,
        TechnicianTimeItem,
        level,
        preAssignList,
        historyPreAssignList,
        doDelayProjectList,
        historyItems
      })
      if (assignItemResult.complete) {
        return assignItemResult
      }
      if (assignItemResult.state == 'complete') {
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: assignItemResult.preAssignList,
          workListObj,
          doDelayProjectList: [...doDelayProjectList],
          historyPreAssignList,
          historyItems
        })
        if (r.state == 'fail' && r.level == level) {
          continue
        } else {
          return r
        }
        // return this.assignOrder({
        //   orderList,
        //   technicianList,
        //   orderItem,
        //   level,
        //   preAssignList,
        //   workListObj,
        //   doDelayProjectList: [...doDelayProjectList],
        //   historyPreAssignList
        // })
      } else if (assignItemResult.state == 'fail') {
        return assignItemResult
      } else {
        const r = this.assign({
          technicianList,
          orderList,
          level: level + 1,
          preAssignList: assignItemResult.preAssignList,
          workListObj,
          doDelayProjectList: [...doDelayProjectList],
          historyPreAssignList,
          historyItems
        })
        if (r.state == 'fail' && r.level == level) {
          continue
        } else {
          return r
        }
      }
    }
    console.log('loooooooooooooooooooooop end')
    return { state: 'fail' }
  },
  reAssign({
    prevProjectEndTime,
    orderItem,
    TechnicianTimeItem,
    level,
    preAssignList,
    historyPreAssignList,
    historyItems,
    doDelayProjectList
  }) {
    const hasDelayReturn = this.hasDelay({
      TechnicianTimeItem,
      prevProjectEndTime,
      level,
      historyItems,
      historyPreAssignList,
      orderItem,
      doDelayProjectList
    })
    if (hasDelayReturn) {
      return hasDelayReturn
    }
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

      if (!findNext || orderItem.id == item.orderID) {
        newPreAssignList.push(item)
      }
    }
    const preAssignListItem = {
      earliestOrderTime: new Date(Math.max(orderItem.preorderTime, prevProjectEndTime)),
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectItem: TechnicianTimeItem.projectItem,
      projectName: TechnicianTimeItem.projectItem.project.name,
      technicianID: TechnicianTimeItem.technicianItem.technician.id,
      technician: TechnicianTimeItem.technicianItem.technician,
      orderID: orderItem.id,
      orderItem,
      preorderTime: orderItem.preorderTime,
      projectID: TechnicianTimeItem.projectItem.project.id,
      timeStart: TechnicianTimeItem.timeStart,
      duration: TechnicianTimeItem.duration,
      timeEnd: new Date(TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000)
    }

    const exchangePreAssignList = this.hasExchangeProject({
      orderItem,
      preAssignList: newPreAssignList,
      assignItem: preAssignListItem,
      TechnicianTimeItem,
      historyItems,
      level
    })
    if (exchangePreAssignList) {
      return exchangePreAssignList
    }
    historyItems[level] = preAssignListItem
    newPreAssignList.push(preAssignListItem)
    return newPreAssignList
  },
  // hasDelay({ TechnicianTimeItem, prevProjectEndTime, level, historyItems, orderItem, doDelayProjectList }) {
  //   const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
  //   const prevDif = TechnicianTimeItem.timeStart - prevProjectEndTime
  //   if (prevDif > delayTime) {
  //     for (let i = 1; i < level; i++) {
  //       let item = null

  //       if (
  //         historyItems[i] &&
  //         historyItems[i].orderID == orderItem.id &&
  //         historyItems[i].projectID == TechnicianTimeItem.projectItem.project.id
  //       ) {
  //         item = historyItems[i]
  //       }
  //       // const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
  //       if (item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > delayTime) {
  //         return true
  //       }

  //       const isDoDelay = doDelayProjectList.find(
  //         (x) => item && x.projectID == item.projectID && x.orderID == item.orderID
  //       )
  //       const mustDoneDelayTime = parseInt(localStorage.mustDoneDelayTime) * 60 * 1000
  //       if (
  //         isDoDelay &&
  //         item &&
  //         TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > mustDoneDelayTime
  //       ) {
  //         return true
  //       }
  //     }
  //   }
  //   return false
  // },
  hasDelay({
    TechnicianTimeItem,
    prevProjectEndTime,
    level,
    historyItems,
    historyPreAssignList,
    orderItem,
    doDelayProjectList
  }) {
    // return false
    const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
    const prevDif = TechnicianTimeItem.timeStart - prevProjectEndTime

    if (prevDif > delayTime) {
      for (let i = level; i >= 1; i--) {
        const item = historyPreAssignList[i].find(
          (x) => x.orderID == orderItem.id && x.projectID == TechnicianTimeItem.projectItem.project.id
        )
        // const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
        if (item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > delayTime) {
          console.log('hasDelay')
          for (let j = i + 1; j <= level; j++) {
            const jItem = historyPreAssignList[j].find(
              (x) =>
                x.technicianID == item.technicianID && !(item.timeStart >= x.timeEnd || item.timeEnd <= x.timeStart)
            )
            if (jItem) {
              return { state: 'fail', level: j - 1 }
            }
          }
          return { state: 'fail', level: i }
        }

        const isDoDelay = doDelayProjectList.find(
          (x) => item && x.projectID == item.projectID && x.orderID == item.orderID
        )
        const mustDoneDelayTime = parseInt(localStorage.mustDoneDelayTime) * 60 * 1000
        if (
          isDoDelay &&
          item &&
          TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > mustDoneDelayTime
        ) {
          console.log('hasDelay')
          for (let j = i + 1; j <= level; j++) {
            const jItem = historyPreAssignList[j].find(
              (x) =>
                x.technicianID == item.technicianID && !(item.timeStart >= x.timeEnd || item.timeEnd <= x.timeStart)
            )
            if (jItem) {
              return { state: 'fail', level: j - 1 }
            }
          }
          return { state: 'fail', level: i }
        }
      }
    }
    return false
  },
  assignItem({
    technicianList,
    orderList,
    workListObj,
    prevProjectEndTime,
    orderItem,
    TechnicianTimeItem,
    level,
    preAssignList,
    historyPreAssignList,
    historyItems,
    doDelayProjectList
  }) {
    const hasDelayReturn = this.hasDelay({
      TechnicianTimeItem,
      prevProjectEndTime,
      level,
      historyItems,
      historyPreAssignList,
      orderItem,
      doDelayProjectList
    })
    if (hasDelayReturn) {
      return hasDelayReturn
    }
    // const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
    // const prevDif = TechnicianTimeItem.timeStart - prevProjectEndTime

    // if (prevDif > delayTime) {
    //   for (let i = 1; i < level; i++) {
    //     const item = historyPreAssignList[i].find(
    //       (x) => x.orderID == orderItem.id && x.projectID == TechnicianTimeItem.projectItem.project.id
    //     )
    //     // const delayTime = parseInt(localStorage.delayTime) * 60 * 1000
    //     if (item && TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > delayTime) {
    //       return { state: 'fail' }
    //     }

    //     const isDoDelay = doDelayProjectList.find(
    //       (x) => item && x.projectID == item.projectID && x.orderID == item.orderID
    //     )
    //     const mustDoneDelayTime = parseInt(localStorage.mustDoneDelayTime) * 60 * 1000
    //     if (
    //       isDoDelay &&
    //       item &&
    //       TechnicianTimeItem.timeStart.getTime() - item.timeStart.getTime() > mustDoneDelayTime
    //     ) {
    //       return { state: 'fail' }
    //     }
    //   }
    // }
    const assignItem = {
      earliestOrderTime: new Date(Math.max(orderItem.preorderTime, prevProjectEndTime)),
      date: this.getDateStart(),
      state: 'unstart',
      technicianName: TechnicianTimeItem.technicianItem.technician.name,
      orderName: orderItem.name,
      projectItem: TechnicianTimeItem.projectItem,
      projectName: TechnicianTimeItem.projectItem.project.name,
      technicianID: TechnicianTimeItem.technicianItem.technician.id,
      technician: TechnicianTimeItem.technicianItem.technician,
      orderID: orderItem.id,
      orderItem,
      preorderTime: orderItem.preorderTime,
      projectID: TechnicianTimeItem.projectItem.project.id,
      timeStart: TechnicianTimeItem.timeStart,
      duration: TechnicianTimeItem.duration,
      timeEnd: new Date(TechnicianTimeItem.timeStart.getTime() + TechnicianTimeItem.duration * 60 * 1000)
    }

    const newPreAssignList = this.hasExchangeProject({
      historyItems,
      level,
      orderItem,
      preAssignList,
      assignItem,
      TechnicianTimeItem
    })

    if (newPreAssignList) {
      const r = this.assign({
        technicianList,
        orderList,
        level: level + 1,
        preAssignList: newPreAssignList,
        workListObj,
        doDelayProjectList: [...doDelayProjectList],
        historyPreAssignList,
        historyItems
      })
      if (r.state == 'complete') {
        r.complete = true
        return r
      }
      // return {
      //   state: 'reassign',
      //   preAssignList: newPreAssignList
      // }
    }
    // preAssignList.push(assignItem)
    const newnewnewPreAssignList = [...preAssignList]
    newnewnewPreAssignList.push(assignItem)
    historyItems[level] = assignItem
    return { state: 'complete', preAssignList: newnewnewPreAssignList }
  },
  getDelayTime({ item, subTime, minorTime }) {
    let typeList = []
    const projectAndAddIDList = [item.projectItem.project.id]
    projectAndAddIDList.push(...item.projectItem.additions.map((a) => a.id))
    let matchResult = true
    for (let id of projectAndAddIDList) {
      if (!item.technician.skillInfo[id] || !item.technician.skillInfo[id].type) {
        matchResult = false
        break
      } else {
        typeList.push(item.technician.skillInfo[id].type)
      }
    }
    if (matchResult) {
      let delayTime = 0
      if (typeList.find((i) => i == 'sub')) {
        delayTime = subTime
      } else if (typeList.find((i) => i == 'minor')) {
        delayTime = minorTime
      }
      return delayTime
    }
    return 999
  },
  findExchangeProjectItem({ preAssignList, reAssignItem, changeItem, newPreAssignList }) {
    const priorityTime = parseInt(localStorage.priorityTime)
    const subTime = parseInt(localStorage.subTime)
    const minorTime = parseInt(localStorage.minorTime)

    const matchItemList = []
    // if (reAssignItem.orderItem.name == '1120') {
    //   // debugger
    // }
    reAssignItem.orderItem.orderInfo.forEach((item) => {
      const hasAssign = preAssignList.find(
        (x) =>
          x.orderID == reAssignItem.orderItem.id &&
          x.projectID == item.project.id &&
          (x.isAdjust || x.timeStart < reAssignItem.timeStart)
      )
      if (hasAssign) {
        return
      }
      let typeList = []
      let duration = 0
      const projectAndAddIDList = [item.project.id]
      projectAndAddIDList.push(...item.additions.map((a) => a.id))
      let matchResult = true
      for (let id of projectAndAddIDList) {
        if (!changeItem.technician.skillInfo[id] || !changeItem.technician.skillInfo[id].type) {
          matchResult = false
          break
        } else {
          duration += changeItem.technician.skillInfo[id].timeDiff || 0
          typeList.push(changeItem.technician.skillInfo[id].type)
        }
      }
      if (matchResult) {
        let delayTime = 0
        if (typeList.find((i) => i == 'sub')) {
          delayTime = subTime
        } else if (typeList.find((i) => i == 'minor')) {
          delayTime = minorTime
        }
        // delayTime += projectPriorityTime
        duration += item.standardTimeAll
        matchItemList.push({ duration, delayTime, projectItem: item })
      }
    })
    if (matchItemList.length <= 0) {
      return null
    }
    matchItemList.sort((x, y) => x.projectItem.kind.priority - y.projectItem.kind.priority)
    matchItemList.forEach((matchItem, i) => {
      matchItem.projectPriorityTime = i * priorityTime
    })
    const firstMatchItem = matchItemList.sort(
      (a, b) => a.delayTime + a.projectPriorityTime - b.delayTime - b.projectPriorityTime
    )[0]

    // 比较changeItem和firstMatchItem（能交换的两个项目）的delayTime（主力后备时间）
    const changeItemDelayTime = this.getDelayTime({ item: changeItem, subTime, minorTime })
    // const reAssignItemDelayTime = this.getDelayTime({ item: reAssignItem, subTime, minorTime })
    if (changeItemDelayTime < firstMatchItem.delayTime) {
      return null
    }
    // if (reAssignItemDelayTime < firstMatchItem.delayTime) {
    //   return null
    // }
    const item = this.clone(reAssignItem)
    item.technicianName = changeItem.technicianName
    item.technicianID = changeItem.technicianID
    item.technician = changeItem.technician
    item.projectID = firstMatchItem.projectItem.project.id
    item.projectItem = firstMatchItem.projectItem
    item.projectName = firstMatchItem.projectItem.project.name
    item.duration = firstMatchItem.duration
    return item
  },
  findExchangeProjectItemParty({ preAssignList, reAssignItem, changeItem, newPreAssignList }) {
    const priorityTime = parseInt(localStorage.priorityTime)
    const subTime = parseInt(localStorage.subTime)
    const minorTime = parseInt(localStorage.minorTime)

    const matchItemList = []
    // if (reAssignItem.orderItem.name == '1120') {
    //   // debugger
    // }
    reAssignItem.orderItem.orderInfo.forEach((item) => {
      const hasAssign = preAssignList.find(
        (x) =>
          x.orderID == reAssignItem.orderItem.id &&
          x.projectID == item.project.id &&
          (x.isAdjust || x.timeStart < reAssignItem.timeStart)
      )
      if (hasAssign) {
        return
      }
      let typeList = []
      let duration = 0
      const projectAndAddIDList = [item.project.id]
      projectAndAddIDList.push(...item.additions.map((a) => a.id))
      let matchResult = true
      for (let id of projectAndAddIDList) {
        if (!changeItem.technician.skillInfo[id] || !changeItem.technician.skillInfo[id].type) {
          matchResult = false
          break
        } else {
          duration += changeItem.technician.skillInfo[id].timeDiff || 0
          typeList.push(changeItem.technician.skillInfo[id].type)
        }
      }
      if (matchResult) {
        let delayTime = 0
        if (typeList.find((i) => i == 'sub')) {
          delayTime = subTime
        } else if (typeList.find((i) => i == 'minor')) {
          delayTime = minorTime
        }
        // delayTime += projectPriorityTime
        duration += item.standardTimeAll
        matchItemList.push({ duration, delayTime, projectItem: item })
      }
    })
    if (matchItemList.length <= 0) {
      return null
    }
    matchItemList.sort((x, y) => x.projectItem.kind.priority - y.projectItem.kind.priority)
    matchItemList.forEach((matchItem, i) => {
      matchItem.projectPriorityTime = i * priorityTime
    })
    const firstMatchItem = matchItemList.sort((a, b) => {
      const diff = a.delayTime + a.projectPriorityTime - b.delayTime - b.projectPriorityTime
      if (diff == 0) {
        return a.duration - b.duration
      }
      return diff
    })[0]

    // 比较changeItem和firstMatchItem（能交换的两个项目）的delayTime（主力后备时间）
    const changeItemDelayTime = this.getDelayTime({ item: changeItem, subTime, minorTime })
    // const reAssignItemDelayTime = this.getDelayTime({ item: reAssignItem, subTime, minorTime })
    if (changeItemDelayTime < firstMatchItem.delayTime) {
      return null
    }
    if (changeItem.duration <= firstMatchItem.duration) {
      return null
    }
    const item = this.clone(reAssignItem)
    item.technicianName = changeItem.technicianName
    item.technicianID = changeItem.technicianID
    item.technician = changeItem.technician
    item.projectID = firstMatchItem.projectItem.project.id
    item.projectItem = firstMatchItem.projectItem
    item.projectName = firstMatchItem.projectItem.project.name
    item.duration = firstMatchItem.duration
    return item
  },
  hasExchangeProject({ historyItems, level, orderItem, preAssignList, assignItem, TechnicianTimeItem }) {
    // 循环查找是否有先来先做的项目
    let reAssignItem = null // 重排的项目
    let changeItem = assignItem // 被替换的项目
    const newPreAssignList = []
    let findItem = false
    for (let p of preAssignList) {
      // 如果已排的项目有开始时间晚于当前项目并且订单时间早于当前项目
      if (
        !findItem &&
        !p.isAdjust &&
        // p.projectItem.project.id == assignItem.projectID &&
        p.timeStart > assignItem.timeStart &&
        p.earliestOrderTime < assignItem.earliestOrderTime
      ) {
        // 先来先做，如果技师能做的话
        const result = this.findExchangeProjectItem({
          preAssignList,
          reAssignItem: p,
          changeItem: assignItem,
          newPreAssignList
        })

        if (result) {
          reAssignItem = result
          findItem = true
        }
      }
      // 如果已排的项目有开始时间早于当前项目并且订单时间晚于当前项目
      if (
        !findItem &&
        !p.isAdjust &&
        // p.projectItem.project.id == assignItem.projectID &&
        p.timeStart < assignItem.timeStart &&
        p.earliestOrderTime > assignItem.earliestOrderTime &&
        p.preorderTime > assignItem.preorderTime // 防止第二个或者更后面的项目被无限拖后
      ) {
        // 先来先做，如果技师能做的话
        const result = this.findExchangeProjectItem({
          preAssignList,
          reAssignItem: assignItem,
          changeItem: p,
          newPreAssignList
        })

        if (result) {
          // debugger
          reAssignItem = result
          changeItem = p
          findItem = true
        }
      }
      // 寻找派对订单看看能不能交换项目（项目耗时短的排在前面）
      if (
        !findItem &&
        !p.isAdjust &&
        // p.projectItem.project.id == assignItem.projectID &&
        p.earliestOrderTime.getTime() == assignItem.earliestOrderTime.getTime()
      ) {
        // debugger
        let result = null
        if (p.timeStart > assignItem.timeStart) {
          result = this.findExchangeProjectItemParty({
            preAssignList,
            reAssignItem: p,
            changeItem: assignItem,
            newPreAssignList
          })
          if (result) {
            reAssignItem = result
            changeItem = assignItem
            findItem = true
          }
        } else if (p.timeStart < assignItem.timeStart) {
          result = this.findExchangeProjectItemParty({
            preAssignList,
            reAssignItem: assignItem,
            changeItem: p,
            newPreAssignList
          })
          if (result) {
            reAssignItem = result
            changeItem = p
            findItem = true
          }
        }
      }

      if (!findItem || orderItem.id == p.orderID) {
        newPreAssignList.push(p)
      }
    }

    if (reAssignItem) {
      let lastTime = new Date(0)
      for (let newItem of newPreAssignList) {
        if (
          newItem.technicianID == changeItem.technicianID &&
          newItem.timeEnd <= changeItem.timeStart &&
          newItem.timeEnd > lastTime
        ) {
          lastTime = newItem.timeEnd
        }
      }

      reAssignItem.timeStart = new Date(Math.max(lastTime, reAssignItem.earliestOrderTime))
      reAssignItem.timeEnd = new Date(reAssignItem.timeStart.getTime() + reAssignItem.duration * 60 * 1000)

      const newnewPreAssignList = this.hasExchangeProject({
        orderItem,
        preAssignList: newPreAssignList,
        assignItem: reAssignItem,
        TechnicianTimeItem,
        historyItems,
        level
      })
      if (newnewPreAssignList) {
        return newnewPreAssignList
      }
      if (this.judgeWorkingTableLimit({ item: reAssignItem, preAssignList: newPreAssignList })) {
        historyItems[level] = reAssignItem
        newPreAssignList.push(reAssignItem)
        return newPreAssignList
      }
      return false
    }
    return false
  },
  getDoProjectJumpList({ prevProjectEndTime, orderItem, projectQueueItem, technicianAssignList, preAssignList }) {
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
      let findItem = false
      for (let assignItem of preAssignList) {
        if (assignItem == item) {
          findItem = true
        }
        if (
          !findItem &&
          assignItem.technicianID == projectQueueItem.technicianItem.technician.id &&
          assignItem.timeEnd > timeStart
        ) {
          timeStart = assignItem.timeEnd
        }
        if (
          !findItem &&
          assignItem.technicianID == projectQueueItem.technicianItem.technician.id &&
          assignItem.timeEnd > lastTimeRelative &&
          (!assignItem.projectItem || assignItem.projectItem.kind.orderRule != '由后到前')
        ) {
          lastTimeRelative = assignItem.timeEnd
        }

        if (!findItem || orderItem.id == assignItem.orderID) {
          newPreAssignList.push(assignItem)
        }
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
        technician: projectQueueItem.technicianItem.technician,
        orderID: orderItem.id,
        orderItem,
        preorderTime: orderItem.preorderTime,
        projectID: projectQueueItem.projectItem.project.id,
        timeStart,
        duration: projectQueueItem.duration,
        timeEnd: new Date(timeStart.getTime() + projectQueueItem.duration * 60 * 1000)
      }
      newPreAssignList.push(jumpAssignItem)
      DoProjectJumpList.push({
        virtualTimeStart: new Date(Math.max(lastTimeRelative, trueOrderTime, this.getDateNow(), this.workBeginTime())),
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
        // if (orderItem.name == '1502' && projectQueueItem.technicianItem.technician.name == 'David') {
        //   // debugger
        // }
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
          const virtualTimeStart = new Date(Math.max(lastTimeRelative, timeStart))
          if (timeStart <= lastTime) {
            this.pushToTechnicianTimeList({
              item: {
                virtualTimeStart,
                lastTimeRelative,
                ...projectQueueItem,
                timeStart: new Date(lastTime),
                last: false,
                next: item
              },
              technicianTimeList,
              preAssignList
            })
            // technicianTimeList.push({
            //   virtualTimeStart,
            //   lastTimeRelative,
            //   ...projectQueueItem,
            //   timeStart: new Date(lastTime),
            //   last: false,
            //   next: item
            // })
          } else if (timeStart < item.timeStart && timeStart > lastTime) {
            this.pushToTechnicianTimeList({
              item: {
                virtualTimeStart,
                lastTimeRelative,
                ...projectQueueItem,
                timeStart: new Date(timeStart),
                last: false,
                next: item
              },
              technicianTimeList,
              preAssignList
            })
            // technicianTimeList.push({
            //   virtualTimeStart,
            //   lastTimeRelative,
            //   ...projectQueueItem,
            //   timeStart: new Date(timeStart),
            //   last: false,
            //   next: item
            // })
          }
        }
        // if (item.timeEnd <= timeStart) {
        //   lastTimeRelative = item.timeEnd
        // }
        if (!item.projectItem || item.projectItem.kind.orderRule != '由后到前') {
          lastTimeRelative = item.timeEnd
        }
        lastTime = item.timeEnd
      })
      this.pushToTechnicianTimeList({
        item: {
          virtualTimeStart: new Date(Math.max(lastTimeRelative, timeStart)),
          lastTimeRelative,
          ...projectQueueItem,
          timeStart: new Date(Math.max(...[lastTime, timeStart])),
          last: true
        },
        technicianTimeList,
        preAssignList
      })
      // technicianTimeList.push({
      //   virtualTimeStart: new Date(Math.max(lastTimeRelative, timeStart)),
      //   lastTimeRelative,
      //   ...projectQueueItem,
      //   timeStart: new Date(Math.max(...[lastTime, timeStart])),
      //   last: true
      // })
    }

    return technicianTimeList.sort((a, b) => {
      const delayA = a.delayTime || 0 + a.projectPriorityTime || 0
      const delayB = b.delayTime || 0 + b.projectPriorityTime || 0
      // 由前到后的排序时间
      let timeA = a.virtualTimeStart.getTime() + delayA * 60 * 1000
      let timeB = b.virtualTimeStart.getTime() + delayB * 60 * 1000
      // 由后到前的排序时间
      if (a.projectItem.kind.orderRule == '由后到前') {
        timeA = a.timeStart.getTime() + delayA * 60 * 1000
      }
      if (b.projectItem.kind.orderRule == '由后到前') {
        timeB = b.timeStart.getTime() + delayB * 60 * 1000
      }
      const timeDif = timeA - timeB

      if (timeDif == 0 && a.projectItem.kind.orderRule == '由后到前' && b.projectItem.kind.orderRule == '由后到前') {
        return b.lastTimeRelative - a.lastTimeRelative
      }

      if (timeDif == 0 && a.projectItem.kind.orderRule == '由前到后' && b.projectItem.kind.orderRule == '由前到后') {
        return a.lastTimeRelative - b.lastTimeRelative
      }
      return timeDif
    })
  },
  judgeWorkingTableLimit({ item, preAssignList }) {
    const limitNumber = window.workingTableLimitObject[item.projectItem.kind.id] || 0
    if (limitNumber <= 0) {
      return true
    } else {
      const matchPreAssignList = preAssignList.filter(
        (p) =>
          p.projectItem &&
          p.projectItem.kind.id == item.projectItem.kind.id &&
          !(
            p.timeStart >= new Date(item.timeStart.getTime() + item.duration * 60 * 1000) || p.timeEnd <= item.timeStart
          )
      )
      if (matchPreAssignList.length < limitNumber) {
        return true
      } else {
        return false
      }
    }
  },
  pushToTechnicianTimeList({ technicianTimeList, item, preAssignList }) {
    const limitNumber = window.workingTableLimitObject[item.projectItem.kind.id]
    if (limitNumber > 0) {
      const matchPreAssignList = preAssignList.filter(
        (p) =>
          p.projectItem &&
          p.projectItem.kind.id == item.projectItem.kind.id &&
          p.technicianID != item.technicianItem.technician.id &&
          !(
            p.timeStart >= new Date(item.timeStart.getTime() + item.duration * 60 * 1000) || p.timeEnd <= item.timeStart
          )
      )
      const countSet = new Set(matchPreAssignList.map((m) => m.technicianID))
      if (countSet.size < limitNumber) {
        technicianTimeList.push(item)
      } else {
        let timeStart
        matchPreAssignList.sort((a, b) => a.timeEnd - b.timeEnd)
        if (matchPreAssignList.length <= limitNumber) {
          timeStart = new Date(matchPreAssignList[0].timeEnd)
        } else {
          timeStart = new Date(matchPreAssignList[matchPreAssignList.length - limitNumber].timeEnd)
        }
        // timeStart = new Date(Math.min(...matchPreAssignList.map((m) => m.timeEnd)))
        if (!item.next || item.next.timeStart > timeStart) {
          item.timeStart = timeStart
          item.virtualTimeStart = timeStart
          this.pushToTechnicianTimeList({ technicianTimeList, item, preAssignList })
        }
        console.log('limit')
      }
    } else {
      technicianTimeList.push(item)
    }
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
        let matchResult = true
        let addDuration = 0
        typeList.push(technicianItem.technician.skillInfo[projectItem.project.id].type)
        for (let add of projectItem.additions) {
          if (!technicianItem.technician.skillInfo[add.id] || !technicianItem.technician.skillInfo[add.id].type) {
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
          // delayTime += projectPriorityTime
          duration = duration + addDuration + projectItem.standardTimeAll
          technicianMatchList.push({ type, technicianItem, delayTime, projectPriorityTime, projectItem, duration })
        }
      }
    })
    return technicianMatchList
  },
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

// export default {
//   install(Vue, options) {
//     init(Vue)
//   }
// }
