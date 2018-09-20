<template lang="pug">
  .page
    .panel.tech-list
      .panel-title 技师列表
      .panet-content
        .tech-line(v-for="i in technicianList")
          .tech-line-name {{i.name}}
          .tech-line-time {{i.lastClock.timeStr}}
    .panel.assign_list
      .panel-title 分配列表
      .panet-content
        .assign-line(v-for="i in assignList")
          el-popover(placement="right" width="200")
            el-button(size="medium" type="text" @click="popVisible = false") 取消
            el-button(type="primary" size="medium" @click="popVisible = false") 固定
            el-button(type="primary" size="medium" @click="popVisible = false") 开始
            el-button.assign-btn(slot="reference" type="primary" size="medium" plain)
              | {{i.techName+'->'+i.orderName}}
              .divider
              | {{i.number+'/'+i.count+' '+i.projectName+' '+i.timeStr}}
    .panel.clock-schedule
      .panel-title 排钟表
      .panet-content
        .schedule-line(v-for="i in timeList")
          .schedule-line-time {{i.time}}
          .schedule-line-order(v-for="j in 4" @click="selectOrder(i.time+'-'+j)")
            el-button.schedule-btn(v-if="positionObj[i.time+'-'+j]" slot="reference" :type="getOrderType(positionObj[i.time+'-'+j])" size="medium" plain)
              .schedule-btn-line
                .name {{positionObj[i.time+'-'+j].name}}
                .number {{positionObj[i.time+'-'+j].number+'/'+positionObj[i.time+'-'+j].count}}
              .divider
              .schedule-btn-line {{positionObj[i.time+'-'+j].projects}}
    OrderModal(:visible.sync="orderVisible" :title="title" :data="selectedOrder" @save="orderSave" @delete="deleteOrder")
</template>
<script>
import OrderModal from '@/components/OrderModal'

export default {
  components: {
    OrderModal
  },
  data() {
    const data = {
      selectedOrder: { orderInfo: [] },
      orderVisible: false,
      workBeginTime: this.$algorithm.workBeginTime(),
      workEndTime: this.$algorithm.workEndTime(),
      dateStart: this.$algorithm.getDateStart(),
      intervals: 15,
      timeList: [],
      title: '',
      projectDuration: 45,
      orderObj: {},
      positionObj: {},
      technicianList: [],
      assignList: []
    }
    this.setTimeList(data)
    console.log('data')
    return data
  },
  errorCaptured() {
    console.log('errorCaptured')
  },
  async created() {
    this.getTechnicianList()
  },
  methods: {
    async getTechnicianList() {
      const attendanceInfo = {}
      const technicianList = []
      await window.IDB.executeTransaction(['attendance', 'technician'], 'readonly', (t) => {
        const store = t.objectStore('attendance')
        const request = store.index('date').openCursor(IDBKeyRange.only(this.dateStart))
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            if (cursor.value.isAttend) {
              attendanceInfo[cursor.value.id] = cursor.value
              const getTechnicianRequest = t.objectStore('technician').get(cursor.value.id)
              getTechnicianRequest.onsuccess = (e) => {
                if (e.target.result) {
                  e.target.result.attendanceInfo = cursor.value
                  e.target.result.lastClock = {
                    time: this.workBeginTime,
                    timeStr: this.workBeginTime.toLocaleTimeString('en-GB').replace(/:00$/, '')
                  }
                  technicianList.push(e.target.result)
                }
              }
            }
            cursor.continue()
          }
        }
      })
      this.technicianList = technicianList.sort((a, b) => a.index - b.index)
    },
    getOrderType(order) {
      return order.isArrive ? 'success' : ''
    },
    getProjects(order) {
      return order.orderInfo.map((x) => x.project.name).join('|')
    },
    orderSave() {
      if (this.selectedOrder.id) {
        this.clearOrder()
      }
      const count = this.selectedOrder.orderInfo.length
      const hour = parseInt(this.title.split('-')[0].split(':')[0])
      const minute = parseInt(this.title.split('-')[0].split(':')[1])
      const timeFirst = new Date(this.dateStart.getTime() + (hour * 60 + minute) * 60 * 1000)
      const timePositions = [
        {
          time: timeFirst,
          position: this.title,
          number: 1,
          count
        }
      ]

      for (let i = 1; i < count; i++) {
        const prevTimePosition = timePositions[timePositions.length - 1]
        let time = new Date(prevTimePosition.time.getTime() + this.projectDuration * 60 * 1000)
        let findPosition = false
        let index = 1
        while (!findPosition) {
          if (index > 4) {
            time = new Date(time.getTime() + this.intervals * 60 * 1000)
            index = 1
          }
          if (time >= this.workEndTime) {
            throw new Error('可用空间不足，无法分配项目！')
          }
          const position = time.toLocaleTimeString('en-GB').replace(/:00$/, '') + '-' + index
          if (this.positionObj[position]) {
            index += 1
          } else {
            findPosition = true
            timePositions.push({
              time,
              position,
              number: i + 1,
              count
            })
          }
        }
      }
      if (!this.selectedOrder.id) {
        this.selectedOrder.orderDate = new Date()
        this.selectedOrder.id = this.$getNewID
      }
      const projects = this.getProjects(this.selectedOrder)
      timePositions.forEach((i) => {
        this.positionObj[i.position] = {
          name: this.selectedOrder.name,
          orderID: this.selectedOrder.id,
          isArrive: this.selectedOrder.isArrive,
          projects,
          ...i
        }
      })
      this.selectedOrder.timePositions = timePositions
      this.orderObj[this.selectedOrder.id] = this.selectedOrder
      this.orderVisible = false
      this.assign()
    },
    clearOrder() {
      this.title = this.selectedOrder.timePositions[0].position
      this.selectedOrder.timePositions.forEach((x) => {
        delete this.positionObj[x.position]
      })
      this.assign()
    },
    deleteOrder() {
      this.selectedOrder.timePositions.forEach((x) => {
        delete this.positionObj[x.position]
      })
      delete this.orderObj[this.selectedOrder.id]
      this.selectedOrder = { orderInfo: [] }
      this.orderVisible = false
      this.assign()
    },
    assign() {
      const orderList = this.getArriveOrder()
      const assignList = []
      orderList.forEach((x, i) => {
        assignList.push({
          techName: this.technicianList[i].name,
          orderName: x.name,
          number: 1,
          count: x.orderInfo.length,
          projectName: x.orderInfo[0].project.name,
          timeStr: '11:00'
        })
      })
      this.assignList = assignList
    },
    getArriveOrder() {
      const orderList = []
      Object.keys(this.orderObj).forEach((x) => {
        let order = this.orderObj[x]
        if (order.isArrive) {
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
    selectOrder(id) {
      this.title = id
      if (this.positionObj[this.title]) {
        this.selectedOrder = this.orderObj[this.positionObj[this.title].orderID]
      } else {
        this.selectedOrder = { orderInfo: [] }
      }

      this.orderVisible = true
    },
    setTimeList(data) {
      const workBeginTime = data.workBeginTime
      const workEndTime = data.workEndTime
      const timeList = []
      let workTime = new Date(workBeginTime)
      while (workTime < workEndTime) {
        timeList.push({ time: workTime.toLocaleTimeString('en-GB').replace(/:00$/, '') })
        workTime = new Date(workTime.getTime() + data.intervals * 60 * 1000)
      }
      data.timeList = timeList
    }
  },
  computed: {},
  watch: {}
}
</script>
<style scoped>
.page {
  background-color: #fff;
  color: #606266;
  font-size: 14px;
}
.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-left: 15px;
  margin-top: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: 2px solid #ebeef5;
}
.panel:last-child {
  margin-right: 15px;
}
.tech-list {
  flex: 0 0 130px;
  overflow: hidden;
}
.assign_list {
  flex: 0 0 180px;
}
.panel-title {
  border-bottom: 2px solid #ebeef5;
  flex: 0 0 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}
.panet-content {
  flex: 1;
  overflow-y: auto;
}
.schedule-line,
.tech-line,
.assign-line {
  display: flex;
  height: 50px;
  border-bottom: 2px solid #ebeef5;
}
.tech-line,
.assign-line {
  overflow: hidden;
  justify-content: center;
  align-items: center;
}
.tech-line-name {
  margin-left: 6px;
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.tech-line-time {
  color: #409eff;
  margin-right: 6px;
  flex: 0 0 40px;
  text-align: right;
}
.schedule-line-time {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 60px;
}
.schedule-line-order {
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex: 1;
  border-left: 2px solid #ebeef5;
}
.schedule-line-order:hover {
  background: #ebeef5;
}
.schedule-line-order:active {
  background: #ebeef5;
}
.divider {
  height: 6px;
}
.assign-btn {
  width: 180px;
  padding: 7px 6px;
}
.schedule-btn {
  flex: 1;
  padding: 8px 6px;
  overflow: hidden;
}
.schedule-btn-line {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.name {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  flex: 1;
  display: flex;
  justify-content: flex-start;
}
.number {
  flex: 0 0 40px;
}
</style>
