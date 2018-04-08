<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
    .table-wraper
      .mark
        //- .tec-name
        .mark-item(v-for="i in 10") {{i+10}}
      .time-line(v-for="t in technicianList")
        .tec-name {{t.name}}
        .hour(v-for="i in 10")
          .half-hour(v-for="i in 2")
            .quarter-hour(v-for="i in 2")
              .five-minutes(v-for="i in 3")
        .project-item(@click="openInfo(pi)" v-for="pi in getWorkList(t.id)" :style="getPIStyle(pi)")
          .project-item-line(v-for="i in getOrderInfo(pi)") {{i}}
      .time-now(:style="{left:getTimeNow()}")
    el-dialog(title='订单详情' :visible.sync='setVisible')
      el-form(label-width="80px" :inline="true")
        .form-line {{selectedInfo}}
        el-form-item(label='开始时间')
          el-time-picker(v-model="selectedItem.timeStart" style="width:200px")
        el-form-item(label='技师')
          el-select(v-model="selectedItem.technicianID" placeholder="请选择")
            el-option(v-for="item in technicianList" :key="item.id" :label="item.name" :value="item.id")
        el-form-item(label='状态')
          el-radio-group(v-model="selectedItem.state" size="medium")
            el-radio-button(label="unstart") 未开始
            el-radio-button(label="starting") 进行中
            el-radio-button(label="complete") 结束
            el-radio-button(label="checkout") 已结账
      .dialog-footer(slot='footer')
        el-button(@click="setVisible=false") 取 消
        el-button(type='danger' @click="cancelAdjust") 撤销调整
        el-button(type='primary' @click="adjust") 调整
</template>
<script>
export default {
  data() {
    return {
      selectedInfo: '',
      selectedItem: {},
      setVisible: false,
      dataTime: this.$algorithm.getDateNow(),
      preAssignList: [],
      technicianList: [],
      orderList: [],
      setIntervalIndex: null
    }
  },
  async created() {
    this.setIntervalIndex = setInterval(() => {
      this.dataTime = this.$algorithm.getDateNow()
      console.log('-------------------------')
      console.log(this.dataTime)
    }, 1000 * 60)
    this.assignpProjects()
  },
  beforeDestroy() {
    clearInterval(this.setIntervalIndex)
  },
  methods: {
    async cancelAdjust() {
      const { orderID, projectID } = this.selectedItem
      await this.$IDB.delete('assign', [orderID, projectID])
      this.assignpProjects()
      this.setVisible = false
    },
    async adjust() {
      console.log(this.selectedItem)

      this.selectedItem.isAdjust = true
      this.selectedItem.timeEnd = new Date(
        this.selectedItem.timeStart.getTime() + this.selectedItem.duration * 60 * 1000
      )
      await this.$IDB.put('assign', this.selectedItem)

      await Promise.all(
        this.preAssignList
          .filter(
            x =>
              x.orderID == this.selectedItem.orderID &&
              x.projectID != this.selectedItem.projectID &&
              x.timeEnd <= this.selectedItem.timeStart
          )
          .map(f => {
            console.log('filter', f)
            f.isAdjust = true
            return this.$IDB.put('assign', f)
          })
      )
      this.assignpProjects()
      this.setVisible = false
    },
    openInfo(pi) {
      this.selectedInfo = this.getOrderInfo(pi).join('   ')
      this.selectedItem = this.$clone(pi)
      console.log(this.selectedItem)
      this.setVisible = true
    },
    async getPreAssignList() {
      const preAssignList = []
      await this.$IDB.executeTransaction(['assign'], 'readonly', t => {
        const store = t.objectStore('assign')
        const request = store.index('date').openCursor(IDBKeyRange.only(this.dateBegin))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            preAssignList.push(cursor.value)
            cursor.continue()
          }
        }
      })
      this.preAssignList = preAssignList
    },
    async getTechnicianList() {
      const attendanceInfo = {}
      const technicianList = []
      await this.$IDB.executeTransaction(['attendance', 'technician'], 'readonly', t => {
        const store = t.objectStore('attendance')
        const request = store.index('date').openCursor(IDBKeyRange.only(this.dateBegin))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            if (cursor.value.isAttend) {
              attendanceInfo[cursor.value.id] = cursor.value
              const getTechnicianRequest = t.objectStore('technician').get(cursor.value.id)
              getTechnicianRequest.onsuccess = e => {
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
      this.technicianList = technicianList
    },
    getTimeString(date) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return `${hours}:${minutes}`
    },
    getOrderInfo(pi) {
      const list = []
      const time = `${this.getTimeString(pi.timeStart)}-${this.getTimeString(pi.timeEnd)}`
      list.push(`${pi.orderName}`)
      list.push(`${time}`)
      list.push(`${pi.projectName}`)
      return list
    },
    getTimeNow() {
      const beginTime = this.$algorithm.workBeginTime()
      const endTime = this.$algorithm.workEndTime()
      const duration = endTime - beginTime
      const start = this.dataTime - beginTime
      const left = start / duration
      return `calc(59px + (100% - 63px) * ${left})`
    },
    getWorkList(id) {
      return this.preAssignList.filter(x => x.technicianID == id)
    },
    getPIStyle(pi) {
      const duration = pi.timeEnd - pi.timeStart
      const beginTime = this.workBeginTime
      const endTime = this.workEndTime
      const totalDuration = endTime - beginTime
      const start = pi.timeStart - beginTime
      const left = start / totalDuration
      const width = duration / totalDuration
      let background = '#67c23a' // 绿
      if (pi.isAdjust) {
        background = '#909399' // 灰
      }
      switch (pi.state) {
        case 'starting':
          background = '#ffcc03'
          break
        case 'complete':
          background = '#fe9403'
          break
        case 'checkout':
          background = '#fe9403'
          break
      }
      return {
        left: `calc(59px + (100% - 60px) * ${left})`,
        width: `calc((100% - 60px) * ${width} + 1px)`,
        background
      }
    },
    async assignpProjects() {
      await this.getTechnicianList()
      const technicianListSort = []
      this.technicianList.forEach(i => {
        technicianListSort.push({
          technician: i,
          startTime: i.lastWorkTime || new Date(0)
        })
      })
      await this.getOrder()
      await this.getPreAssignList()
      console.log(' this.orderList', this.orderList)

      this.orderList.sort((a, b) => {
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
      const { preAssignList } = this.$algorithm.assign({
        technicianList: technicianListSort,
        orderList: this.orderList,
        level: 1,
        preAssignList: this.preAssignList,
        workListObj: {}
      })
      console.timeEnd('a')
      this.preAssignList = preAssignList || []
      console.log({ preAssignList })
    },
    async getOrder() {
      const orderList = []
      await this.$IDB.executeTransaction(['order'], 'readonly', t => {
        const store = t.objectStore('order')
        const request = store.index('preorderTime').openCursor(IDBKeyRange.bound(this.dateBegin, this.dateEnd))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            orderList.push(cursor.value)
            if (cursor.value.otherFormDatas) {
              orderList.push(
                ...cursor.value.otherFormDatas.map(o =>
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
      orderList.forEach(orderItem => {
        orderItem.orderInfo.forEach(orderInfoItem => {
          promiseList.push(this.getStandardTime(orderInfoItem))
        })
      })
      await Promise.all(promiseList)
      this.orderList = orderList
    },
    async getStandardTime(orderInfoItem) {
      const promiseList = [this.$IDB.get('project', orderInfoItem.project.id)]
      orderInfoItem.additions.forEach(addItem => {
        promiseList.push(this.$IDB.get('addition', addItem.id))
      })
      const promiseResult = await Promise.all(promiseList)
      orderInfoItem.standardTimeAll = promiseResult.reduce((accumulator, currentValue) => {
        let standardTime = 0
        if (currentValue && currentValue.standardTime) {
          standardTime = currentValue.standardTime
        }
        return accumulator + standardTime
      }, 0)
    }
  },
  computed: {
    dateBegin() {
      return new Date(this.dataTime.toDateString())
    },
    dateEnd() {
      return new Date(this.dateBegin.getTime() + 24 * 60 * 60 * 1000 - 1)
    },
    workBeginTime() {
      const day = this.dataTime.getDay()
      let time
      if (day > 0 && day < 6) {
        time = parseInt(localStorage.workBeginTime)
      } else {
        time = parseInt(localStorage.weekendBeginTime)
      }
      return new Date(this.dateBegin.getTime() + time * 60 * 60 * 1000)
    },
    workEndTime() {
      const day = this.dataTime.getDay()
      let time
      if (day > 0 && day < 6) {
        time = parseInt(localStorage.workEndTime)
      } else {
        time = parseInt(localStorage.weekendEndTime)
      }
      return new Date(this.dateBegin.getTime() + time * 60 * 60 * 1000)
    }
  },
  watch: {
    async dataTime(val) {
      this.assignpProjects()
    }
  }
}
</script>
<style scoped>
.form-line {
  color: #909399;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebebeb;
  height: 30px;
}
.text {
  width: 185px;
}
.project-item {
  cursor: pointer;
  border: 1px solid white;
  border-radius: 3px;
  opacity: 0.9;
  box-sizing: border-box;
  /* word-break: break-all; */
  padding: 0 2px;
  /* display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; */
  overflow: hidden;
  word-wrap: break-word;
  color: white;
  font-size: 12px;
  position: absolute;
  top: 0;
  bottom: 0;
  /* left: calc(59px + (100% - 63px) * 0.1);
  width: calc((100% - 63px) * 0.1 / 60 * 45 + 1px); */
  background: #67c23a;
}
.project-item-line {
  line-height: 15px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.mark {
  padding-left: 60px;
  height: 20px;
  display: flex;
  border-bottom: 1px solid #909399;
}
.breadcrumb-wraper {
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex: 0 0 50px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eaeefb;
}
.table-wraper {
  color: #606266;
  position: relative;
  flex: 1;
  margin-left: 8px;
  padding-right: 3px;
  overflow: hidden;
  overflow-y: auto;
}
.time-line {
  box-sizing: border-box;
  position: relative;
  flex: 1;
  display: flex;
  align-items: stretch;
  /* background: palegoldenrod; */
  height: 50px;
  overflow: hidden;
  border-bottom: 1px solid #909399;
}
.tec-name {
  box-sizing: border-box;
  flex: 0 0 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #909399;
  border-right: 1px solid #909399;
}
.mark-item {
  display: flex;
  flex: 1;
}
.hour {
  display: flex;
  align-items: flex-end;
  flex: 1;
  border-right: 1px solid #909399;
}
.half-hour {
  display: flex;
  align-items: flex-end;
  flex: 1;
  height: 35px;
}
.half-hour:first-child,
.quarter-hour:first-child {
  border-right: 1px solid #909399;
}
.quarter-hour {
  display: flex;
  align-items: flex-end;
  flex: 1;
  height: 25px;
}
.five-minutes {
  display: flex;
  align-items: flex-end;
  flex: 1;
  height: 15px;
  border-right: 1px solid #909399;
}
.five-minutes:last-child {
  border-right: none;
}
.time-now {
  top: 20px;
  bottom: 0;
  width: 2px;
  background: orangered;
  position: absolute;
}
</style>
