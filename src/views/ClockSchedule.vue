<template lang="pug">
  .page
    .panel.tech-list
      .panel-title 技师列表
      .panet-content
        .tech-line(v-for="i in technicianList" :class="{'free-tech':isTechFree(i)}")
          .tech-line-name {{i.name}}
          .tech-line-time {{i.lastClock.timeStr}}
    .panel.assign_list
      .panel-title 预分配
      .panet-content
        AssignItemPopover(v-for="i,index in data.preAssignList" :key="i.id" :assignItem="i" :index="index")
    .panel.assign_list
      .panel-title
        | 已分配
        i.el-icon-circle-plus-outline.add-assign-item(@click="assignVisible=true")
      .panet-content
        AssignItemPopover(v-for="i,index in data.assignList" :key="i.id" :assignItem="i" :index="index")
    .panel.clock-schedule
      .panel-title
        | 排钟表
        el-time-picker.time-now(@change="dateTimeNowChange" v-model="dateTimeNow" size="medium")
        el-button.clear-btn(@click="clearScheduleData" type="danger" size="mini") 清空数据
      .panet-content
        .schedule-line(v-for="i in timeList")
          .schedule-line-time {{i.time}}
          .schedule-line-order(v-for="j in i.orderCount" @click="selectOrder(i.time+'-'+j)")
            el-button.schedule-btn(v-if="positionObj[i.time+'-'+j]" slot="reference" :type="getOrderType(positionObj[i.time+'-'+j])" size="medium" plain)
              .schedule-btn-line
                .name {{positionObj[i.time+'-'+j].name}}
                .number {{positionObj[i.time+'-'+j].number+'/'+positionObj[i.time+'-'+j].count}}
              .project-group
                .project-item(v-for="k in orderObj[positionObj[i.time+'-'+j].orderID].orderInfo||[]")
                  .project-name {{k.project.name}}
                  .project-tech {{getDesignatedTech(k.technicians)}}
              //- .schedule-btn-line
              //-   .name {{positionObj[i.time+'-'+j].projects}}
              //- .divider
              //- .schedule-btn-line
              //-   .name {{positionObj[i.time+'-'+j].projects}}
            .empty-schedule(v-if="!positionObj[i.time+'-'+j]" )
              i.el-icon-circle-plus
          .schedule-line-order(v-for="j in getOverFlowOrder(i)" @click="selectOrder(j.position)")
            el-button.schedule-btn(slot="reference" :type="getOrderType(j)" size="medium" plain)
              .schedule-btn-line
                .name {{j.name}}
                .number {{j.number+'/'+j.count}}
              .divider
              .schedule-btn-line
                .name {{j.projects}}
    OrderModal(:visible.sync="orderVisible" :title="title" :data="selectedOrder" @save="orderSave" @delete="deleteOrder")
    AssignModal(:visible.sync="assignVisible")
</template>
<script>
import OrderModal from '@/components/OrderModal'
import AssignModal from '@/components/AssignModal'
import AssignItemPopover from '@/components/AssignItemPopover'

export default {
  components: {
    AssignModal,
    OrderModal,
    AssignItemPopover
  },
  data() {
    return {
      dateTimeNow: this.$algorithm.getDateNow(),
      selectedOrder: { orderInfo: [], isArrive: 'notArrive' },
      orderVisible: false,
      assignVisible: false,
      workBeginTime: this.$algorithm.workBeginTime(),
      workEndTime: this.$algorithm.workEndTime(),
      dateStart: this.$algorithm.getDateStart(),
      intervals: 15,
      title: '',
      projectDuration: 45,
      data: this.$algorithm.data,
      techCount: 0
    }
  },
  async created() {
    this.getTechCount()
    this.$algorithm.initData()
  },
  methods: {
    async getTechCount() {
      await window.IDB.executeTransaction(['technician'], 'readonly', (t) => {
        const store = t.objectStore('technician')
        const request = store.count()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          this.techCount = cursor
        }
      })
    },
    getDesignatedTech(techs) {
      return techs.map((x) => x.name.substr(0, 2)).join(' ')
    },
    isTechFree(tech) {
      return !this.data.assignList.find((x) => x.techID == tech.id && x.status == 'start')
    },
    dateTimeNowChange(val) {
      localStorage.dateTimeNow = new Date(2018, 1, 26, val.getHours(), val.getMinutes(), val.getSeconds()).toISOString()
      this.assign()
    },
    async getSchedule() {
      const r = await this.$IDB.get('schedule', this.dateStart)
      if (r) {
        this.positionObj = r.positionObj
        this.orderObj = r.orderObj
      }
    },
    getOrderType(order) {
      switch (order.isArrive) {
        case 'arrive':
          return 'success'
        case 'arriveNoCompute':
          return 'primary'
        case 'notArrive':
          return ''
        default:
          return ''
      }
    },
    getProjects(order) {
      return order.orderInfo.map((x) => x.project.name).join('|')
    },
    orderSave(temp) {
      let oldPositions = []
      if (this.selectedOrder.id) {
        oldPositions = [...this.selectedOrder.timePositions]
        this.clearOrder()
      } else {
        this.selectedOrder.isfree = true
      }
      const count = this.selectedOrder.orderInfo.length
      const hour = parseInt(this.title.split('-')[0].split(':')[0])
      const minute = parseInt(this.title.split('-')[0].split(':')[1])
      const timeFirst = new Date(this.dateStart.getTime() + (hour * 60 + minute) * 60 * 1000)
      const timePositions = [
        {
          time: timeFirst,
          timeStr: timeFirst.toLocaleTimeString('en-GB').replace(/:00$/, ''),
          position: this.title,
          number: 1,
          count,
          index: parseInt(this.title.split('-')[1])
        }
      ]

      for (let i = 1; i < count; i++) {
        const prevTimePosition = timePositions[timePositions.length - 1]
        let time = new Date(prevTimePosition.time.getTime() + this.projectDuration * 60 * 1000)
        let findPosition = false
        let index = 1
        while (!findPosition) {
          let timeItem = this.timeList.find((x) => x.time == time.toLocaleTimeString('en-GB').replace(/:00$/, ''))
          if (!timeItem) {
            throw new Error('可用空间不足，无法分配项目！')
          }
          if (index > timeItem.orderCount) {
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
              timeStr: time.toLocaleTimeString('en-GB').replace(/:00$/, ''),
              position,
              number: i + 1,
              count,
              index
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
        if (i.index > this.positionObj.maxIndex) {
          this.positionObj.maxIndex = i.index
        }
      })
      this.selectedOrder.timePositions = timePositions
      this.$set(this.orderObj, this.selectedOrder.id, this.selectedOrder)
      // 响应式 this.orderObj[this.selectedOrder.id] = this.selectedOrder
      this.judgeMove(oldPositions)
      this.orderVisible = false

      if (temp != 'temp') {
        this.assign()
        this.saveDB()
      }
    },
    clearOrder() {
      this.title = this.selectedOrder.timePositions[0].position
      this.selectedOrder.timePositions.forEach((x) => {
        delete this.positionObj[x.position]
      })
      // this.assign()
    },
    deleteOrder() {
      const oldPositions = [...this.selectedOrder.timePositions]
      this.selectedOrder.timePositions.forEach((x) => {
        delete this.positionObj[x.position]
      })
      this.$delete(this.orderObj, this.selectedOrder.id)
      // 响应式delete this.orderObj[this.selectedOrder.id]
      this.selectedOrder = { orderInfo: [], isArrive: 'notArrive' }
      this.judgeMove(oldPositions)
      console.log(this.positionObj)
      this.orderVisible = false
      this.assign()
      this.saveDB()
    },
    saveDB() {
      this.$algorithm.saveScheduleData()
    },
    async clearScheduleData() {
      const r = await this.$confirm('此操作将清空所有订单数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      if (r != 'confirm') return
      await window.IDB.delete('schedule', this.dateStart)
      this.$algorithm.initData()
    },
    judgeMove(oldPositions) {
      oldPositions.forEach((x) => {
        if (!this.positionObj[x.position]) {
          this.MoveLeft(x)
        }
      })
    },
    MoveLeft(position) {
      // 取当前行该位置后的所有项目Object.keys().filter.sort，按顺序重新设置序号，再判断最后一个空位是否由满变空
      // 如果由满变空 取后面的项目依次判断能否上移，Object.keys().filter.sort
      // 然后再嵌套执行this.MoveLeft(x)
      const timeItem = this.timeList.find((x) => x.time == position.timeStr)
      if (!timeItem) return
      const lastPosition = `${position.timeStr}-${timeItem.orderCount}`
      let lastPositionItem = null
      if (position.position == lastPosition) {
        lastPositionItem = position
      }
      lastPositionItem = lastPositionItem || this.positionObj[lastPosition]
      const moveList = Object.keys(this.positionObj)
        .filter((x) => this.positionObj[x].timeStr == position.timeStr && this.positionObj[x].index > position.index)
        .sort((a, b) => this.positionObj[a].index - this.positionObj[b].index)
        .map((x) => this.positionObj[x])
      for (let i = position.index; i <= timeItem.orderCount; i++) {
        let positionItem = moveList.shift()
        if (!positionItem) break
        let oldPosition = positionItem.position
        positionItem.position = `${positionItem.timeStr}-${i}`
        positionItem.index = i
        this.positionObj[positionItem.position] = positionItem
        delete this.positionObj[oldPosition]
        // set timePositions
        let timePositionItem = this.orderObj[positionItem.orderID].timePositions.find((x) => x.position == oldPosition)
        if (timePositionItem) {
          timePositionItem.position = positionItem.position
          timePositionItem.index = positionItem.index
        }
      }
      if (lastPositionItem && !this.positionObj[lastPosition]) {
        this.moveUp(lastPositionItem)
      }
    },
    moveUp(position) {
      console.log('moveUp')
      console.log(position)
      const moveList = Object.keys(this.positionObj)
        .filter((x) => {
          let result = false
          const positionItem = this.positionObj[x]
          if (positionItem.timeStr > position.timeStr && positionItem.number > 1) {
            let prevPositionItem = this.orderObj[positionItem.orderID].timePositions[positionItem.number - 2]
            if (position.time - prevPositionItem.time >= this.projectDuration * 60 * 1000) {
              result = true
            }
          }
          return result
        })
        .sort((a, b) => {
          let pa = this.positionObj[a]
          let pb = this.positionObj[b]
          if (pa.time.getTime() == pb.time.getTime()) {
            return pa.index - pb.index
          }
          return pa.time - pb.time
        })
        .map((x) => this.positionObj[x])
      if (moveList.length > 0) {
        let positionItem = moveList[0]
        this.selectedOrder = this.orderObj[positionItem.orderID]
        this.title = this.orderObj[positionItem.orderID].timePositions[0].position
        this.orderSave('temp')
      }
    },
    getOverFlowOrder(timeItem) {
      // 根据maxIndex 依次寻找溢出的项目
      // 或者用Object.keys()也可以一试
      return Object.keys(this.positionObj)
        .filter((x) => this.positionObj[x].timeStr == timeItem.time && this.positionObj[x].index > timeItem.orderCount)
        .sort((a, b) => this.positionObj[a].index - this.positionObj[b].index)
        .map((x) => this.positionObj[x])
    },
    assign() {
      this.$algorithm.assign()
    },
    selectOrder(id) {
      this.title = id
      if (this.positionObj[this.title]) {
        this.selectedOrder = this.orderObj[this.positionObj[this.title].orderID]
      } else {
        this.selectedOrder = { orderInfo: [], isArrive: 'notArrive' }
      }

      this.orderVisible = true
    }
  },
  computed: {
    orderObj() {
      return this.data.orderObj
    },
    timeList() {
      return this.data.timeList
    },
    positionObj() {
      return this.data.positionObj
    },
    technicianList() {
      return this.data.technicianList
    },
    assignList() {
      return this.data.assignList
    }
  },
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
.add-assign-item {
  position: absolute;
  right: 4px;
  font-size: 26px;
  font-weight: bolder;
  cursor: pointer;
}
.panel:last-child {
  margin-right: 15px;
}
.tech-list {
  flex: 0 0 130px;
  overflow: hidden;
}
.assign_list {
  flex: 0 0 200px;
  padding: 0 2px;
  overflow: hidden;
}
.panel-title {
  position: relative;
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
  overflow: auto;
}
.clock-schedule .panet-content {
  padding-top: 4px;
}
.tech-line {
  display: flex;
  height: 50px;
  border-bottom: 2px solid #ebeef5;
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  overflow: hidden;
  justify-content: center;
  align-items: center;
}
.tech-line.free-tech {
  border-bottom: 1px solid #fff;
  background: #f5222d;
  color: #fff;
}
.schedule-line {
  display: flex;
  width: auto;
  height: 80px;
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
.tech-line.free-tech .tech-line-time {
  color: #fff;
}
.schedule-line-time {
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 60px;
  /* border-bottom: 2px solid #ebeef5; */
  position: sticky;
  color: #409eff;
  left: 0;
}
.schedule-line-order {
  margin-left: 4px;
  margin-bottom: 4px;
  overflow: hidden;
  display: flex;
  flex: 0 0 220px;
}
.empty-schedule i {
  font-size: 30px;
  color: #c0c4cc;
}
.empty-schedule:hover {
  background: #ebeef5;
}
.schedule-line-order:active {
  background: #ebeef5;
}
.divider {
  height: 6px;
}

.schedule-btn {
  flex: 1;
  padding: 8px 6px;
  overflow: hidden;
}
.empty-schedule {
  border: 1px solid #dcdfe6;
  cursor: pointer;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 6px;
  overflow: hidden;
  font-size: 14px;
  border-radius: 4px;
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
  text-align: left;
}
.number {
  flex: 0 0 40px;
}
.time-now {
  position: absolute;
  right: 15px;
}
.clear-btn {
  position: absolute;
  left: 15px;
}
.project-group {
  /* background: #f5222d; */
  height: 38px;
  display: flex;
  padding-top: 10px;
}
.project-item {
  flex: 1;

  overflow: hidden;
}
.project-item:not(:last-child) {
  border-right: 1px solid;
}
.project-name,
.project-tech {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  height: 18px;
}
</style>
