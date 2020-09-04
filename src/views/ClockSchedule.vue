<template lang="pug">
  .page
    .panel.tech-list
      .panel-title 技师列表
      .panet-content
        .tech-line(v-for="i in technicianList" :class="{'free-tech':isTechFree(i)}")
          .tech-line-name {{i.name}}
          .tech-line-time {{formatTime(i.lastClock.timeStr)}}
    .panel.assign_list
      .panel-title 预分配
      .panet-content
        .unmatch-item(v-for="i in unmatchOrderList")
          .btn-line
            i.el-icon-error
            | {{i.position}} / {{i.orderName}}
          .divider
          .btn-line {{i.number}}/{{i.count}} {{i.projects}}
        AssignItemPopover(v-for="i,index in data.preAssignList" :key="i.id" :assignItem="i" :index="index")
    .panel.assign_list
      .panel-title
        | 已分配
        span.sort-type {{sortTtype }}
        i.el-icon-circle-plus-outline.add-assign-item(@click="assignVisible=true")
        i.el-icon-sort.sort-assign-item(@click="changeSortType")
      .panet-content
        AssignItemPopover(@modifyAssign="openModifyAssignModal"   assign v-for="i,index in assignList" :key="i.id" :assignItem="i" :index="index")
    .panel.clock-schedule
      .panel-title
        | 排钟表
        .time-now(v-if="isRealtime") {{realtime}}
        el-time-picker.time-now(v-if="!isRealtime" format="hh:mm:ss A" @change="dateTimeNowChange" v-model="dateTimeNow" size="medium")
        el-dropdown.manage-btn(trigger="click" v-if="!showChange")
          i.el-icon-setting.setting-btn
          el-dropdown-menu(slot="dropdown")
            el-dropdown-item
              el-button(style="width:120px" @click="manage" type="primary") 空格管理
            .divider
            .divider
            .divider
            el-dropdown-item
              el-button(style="width:120px" @click="showChange=true" type="success") 交换项目
            .divider
            .divider
            .divider
            el-dropdown-item
              el-button(style="width:120px" @click="clearScheduleData" type="danger") 清空数据
            .divider
            .divider
            .divider
            el-dropdown-item
              el-button(style="width:120px") 取消
        template(v-if="showChange")
          el-button.change-confirm-btn(@click="comfirmChange" type="primary" size="mini") 确定交换
          el-button.change-cancel-btn(@click="cancelChange" size="mini") 取消交换
      .panet-content.schedule-content
        .schedule-time-content
          .schedule-line-time-shadow
            .schedule-line-time(v-for="i in timeList") {{formatTime(i.time)}}
        .schedule-order-content
          .schedule-line(v-for="i in timeList")
            .schedule-line-order(v-for="j in getOrderCount(i)" @click="selectOrder(i.time+'-'+j)")
              //- .lock
              //-   //- i.el-icon-remove
              .change-modal(v-if="showChange")
                i.el-icon-circle-check-outline(v-if="(!positionObj[i.time+'-'+j]||positionObj[i.time+'-'+j].number==1)&&changeList.length<2&&!changeList.includes(i.time+'-'+j)")
                i.el-icon-circle-check(v-if="changeList.includes(i.time+'-'+j)")
                //- i {{j}}
                //- i {{i}}
              el-button.schedule-btn(v-if="positionObj[i.time+'-'+j]" slot="reference" :type="getOrderType(positionObj[i.time+'-'+j])" size="medium" plain)
                .schedule-btn-line
                  .name {{positionObj[i.time+'-'+j].name}}
                  .number {{positionObj[i.time+'-'+j].number+'/'+positionObj[i.time+'-'+j].count}}
                .project-group
                  .project-item(v-for="k in getOrderInfo(orderObj[positionObj[i.time+'-'+j].orderID])")
                    .project-name {{k.project.name}}
                    .project-tech {{getDesignatedTech(k.technicians)}}
                  //- divider
                //- .schedule-btn-line
                //-   .name {{positionObj[i.time+'-'+j].projects}}
                //- .divider
                //- .schedule-btn-line
                //-   .name {{positionObj[i.time+'-'+j].projects}}
              .empty-schedule(v-if="!positionObj[i.time+'-'+j]" )
                i.el-icon-remove(v-if="lockedPosition.includes(i.time+'-'+j)")
                i.el-icon-circle-plus(v-else)
            .schedule-line-order(v-for="j in getOverFlowOrder(i)" @click="selectOrder(j.position)")
              .change-modal(v-if="showChange")
                i.el-icon-circle-check-outline(v-if="(!positionObj[j.position]||positionObj[j.position].number==1)&&changeList.length<2&&!changeList.includes(i.time+'-'+j)")
                i.el-icon-circle-check(v-if="changeList.includes(j.position)")
                //- i {{j.position}}
                //- i {{i}}
              el-button.schedule-btn(slot="reference" :type="getOrderType(j)" size="medium" plain)
                .schedule-btn-line
                  .name {{j.name}}
                  .number {{j.number+'/'+j.count}}
                .project-group
                  .project-item(v-for="k in getOrderInfo(orderObj[j.orderID])")
                    .project-name {{k.project.name}}
                    .project-tech {{getDesignatedTech(k.technicians)}}
            //- .add-schedule
            //-     i.el-icon-circle-plus-outline
    OrderModal(:visible.sync="orderVisible" :technicianList="technicianList" :title="title" :data="selectedOrder" @save="orderSave" @delete="deleteOrder")
    AssignModal(:visible.sync="assignVisible")
    ModifyAssignModal(:visible.sync="modifyAssignVisible" :assignItem='modifyAssignItem')
    TimeCountManageModal(:visible.sync="timeCountVisible" :data="data")
</template>
<script>
import OrderModal from '@/components/OrderModal'
import AssignModal from '@/components/AssignModal'
import ModifyAssignModal from '@/components/ModifyAssignModal'
import AssignItemPopover from '@/components/AssignItemPopover'
import TimeCountManageModal from '@/components/TimeCountManageModal'

export default {
  components: {
    AssignModal,
    OrderModal,
    ModifyAssignModal,
    AssignItemPopover,
    TimeCountManageModal
  },
  data() {
    return {
      sortTtype: '按时间',
      modifyAssignItem: null,
      isRealtime: localStorage.realtime == 'true',
      realtime: new Date().toLocaleTimeString('en'),
      interval: null,
      changeList: [],
      showChange: false,
      timeCountVisible: false,
      dateTimeNow: this.$algorithm.getDateNow(),
      selectedOrder: { orderInfo: [], isArrive: 'notArrive' },
      orderVisible: false,
      assignVisible: false,
      modifyAssignVisible: false,
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
    this.showRealtime()
    this.getTechCount()
    this.$algorithm.initData()
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    changeSortType() {
      if (this.sortTtype == '按时间') {
        this.sortTtype = '按分配'
      } else {
        this.sortTtype = '按时间'
      }
    },
    getOrderInfo(orderItem) {
      if (!orderItem) {
        return []
      }
      return orderItem.orderInfo || []
    },
    openModifyAssignModal(assignItem) {
      this.modifyAssignItem = assignItem
      this.modifyAssignVisible = true
    },
    showRealtime() {
      if (this.isRealtime) {
        this.interval = setInterval(() => {
          this.realtime = new Date().toLocaleTimeString('en')
          // console.log('realtime')
        }, 1000)
      }
    },
    comfirmChange() {
      // orderObj -- timePositions
      // positionObj
      if (this.changeList.length != 2) {
        this.$message({
          showClose: true,
          message: '请选择两个项目！',
          type: 'error'
        })
        return
      }
      if (
        !this.positionObj[this.changeList[0]] &&
        !this.positionObj[this.changeList[1]]
      ) {
        this.$message({
          showClose: true,
          message: '不能交换两个空位！',
          type: 'error'
        })
        return
      }
      // 排序
      this.changeList.sort((x, y) => {
        let timeStrX = x.split('-')[0]
        let indexX = parseInt(x.split('-')[1])
        let timeStrY = y.split('-')[0]
        let indexY = parseInt(y.split('-')[1])
        if (timeStrX == timeStrY) {
          return indexX - indexY
        }
        if (timeStrX > timeStrY) {
          return 1
        }
        return -1
      })
      // 记录orderID,清除数据
      let orderIDA, orderIDB
      if (this.positionObj[this.changeList[0]]) {
        orderIDB = this.positionObj[this.changeList[0]].orderID
        this.orderObj[orderIDB].timePositions.forEach(x => {
          delete this.positionObj[x.position]
        })
      }
      if (this.positionObj[this.changeList[1]]) {
        orderIDA = this.positionObj[this.changeList[1]].orderID
        this.orderObj[orderIDA].timePositions.forEach(x => {
          delete this.positionObj[x.position]
        })
      }

      console.log(this.changeList)
      let oldPositions = this.placingOrder(orderIDA, this.changeList[0])
      oldPositions = [
        ...oldPositions,
        ...this.placingOrder(orderIDB, this.changeList[1])
      ]
      oldPositions.sort((x, y) => {
        if (x.time.getTime() == y.time.getTime()) {
          return x.index - y.index
        }
        return x.time - y.time
      })
      this.judgeMove(oldPositions)
      this.showChange = false
      this.changeList = []
      this.assign()
      this.saveDB()
    },
    placingOrder(orderID, position) {
      if (!orderID) return []
      let order = this.orderObj[orderID]
      let oldPositions = [...order.timePositions]

      const count = order.orderInfo.length
      const hour = parseInt(position.split('-')[0].split(':')[0])
      const minute = parseInt(position.split('-')[0].split(':')[1])
      const timeFirst = new Date(
        this.dateStart.getTime() + (hour * 60 + minute) * 60 * 1000
      )
      const timePositions = [
        {
          time: timeFirst,
          timeStr: timeFirst.toLocaleTimeString('en-GB').replace(/:00$/, ''),
          position: position,
          number: 1,
          count,
          index: parseInt(position.split('-')[1])
        }
      ]

      for (let i = 1; i < count; i++) {
        const prevTimePosition = timePositions[timePositions.length - 1]
        let time = new Date(
          prevTimePosition.time.getTime() + this.projectDuration * 60 * 1000
        )
        let findPosition = false
        let index = 1
        while (!findPosition) {
          let timeItem = this.timeList.find(
            x => x.time == time.toLocaleTimeString('en-GB').replace(/:00$/, '')
          )
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
          const position =
            time.toLocaleTimeString('en-GB').replace(/:00$/, '') + '-' + index
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

      const projects = this.getProjects(order)
      timePositions.forEach(i => {
        this.positionObj[i.position] = {
          name: order.name,
          orderID: order.id,
          isArrive: order.isArrive,
          projects,
          ...i
        }
        if (i.index > this.positionObj.maxIndex) {
          this.positionObj.maxIndex = i.index
        }
      })
      order.timePositions = timePositions
      // this.$set(this.orderObj, order.id, order)
      // 响应式 this.orderObj[this.selectedOrder.id] = this.selectedOrder
      // this.judgeMove(oldPositions)
      // this.orderVisible = false
      return oldPositions
    },
    cancelChange() {
      this.showChange = false
      this.changeList = []
    },
    formatTime(str, hasMeridiem) {
      if (!str) return ''
      let meridiem = 'AM'
      const array = str.split(':')
      let hours = parseInt(array[0])
      const minutes = array[1]
      if (hours >= 12) {
        meridiem = 'PM'
        if (hours > 12) {
          hours -= 12
        }
      } else if (hours == 0) {
        hours = 12
      }
      return `${hours}:${minutes}${hasMeridiem ? meridiem : ''}`
    },
    manage() {
      this.timeCountVisible = true
    },
    async getTechCount() {
      await window.IDB.executeTransaction(['technician'], 'readonly', t => {
        const store = t.objectStore('technician')
        const request = store.count()
        request.onsuccess = event => {
          const cursor = event.target.result
          this.techCount = cursor
        }
      })
    },
    getDesignatedTech(techs) {
      return techs.map(x => x.name.substr(0, 2)).join(' ')
    },
    isTechFree(tech) {
      return !this.data.assignList.find(
        x => x.techID == tech.id && x.status == 'start'
      )
      // let isFree = !this.data.assignList.find((x) => x.techID == tech.id && x.status == 'start')
      // if (isFree && tech.lastClock.time > this.$algorithm.getDateNow()) {
      //   isFree = false
      // }
      // return isFree
    },
    dateTimeNowChange(val) {
      let localDateTimeNow = new Date(localStorage.dateTimeNow || '2018/2/26')
      localStorage.dateTimeNow = new Date(
        localDateTimeNow.getFullYear(),
        localDateTimeNow.getMonth(),
        localDateTimeNow.getDate(),
        val.getHours(),
        val.getMinutes(),
        val.getSeconds()
      ).toISOString()
      // localStorage.dateTimeNow = new Date(
      //   2018,
      //   1,
      //   26,
      //   val.getHours(),
      //   val.getMinutes(),
      //   val.getSeconds()
      // ).toISOString()
      this.assign()
      window.algDataChange.scheduleDataChange()
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
      return order.orderInfo.map(x => x.project.name).join('|')
    },
    orderSave(temp) {
      let oldPositions = []
      if (this.selectedOrder.id) {
        // 如果订单所有项目未分配并且已分配的项目都已经完成，订单状态就是空闲 isfree = true，其他状态就是不空闲
        if (
          this.selectedOrder.orderInfo.some(x => !x.assignItemID) &&
          this.selectedOrder.orderInfo.every(
            x => !x.assignItemID || x.status == 'end'
          )
        ) {
          this.selectedOrder.isfree = true
        } else {
          this.selectedOrder.isfree = false
        }

        oldPositions = [...this.selectedOrder.timePositions]
        this.clearOrder()
      } else {
        this.selectedOrder.isfree = true
      }
      const count = this.selectedOrder.orderInfo.length
      const hour = parseInt(this.title.split('-')[0].split(':')[0])
      const minute = parseInt(this.title.split('-')[0].split(':')[1])
      const timeFirst = new Date(
        this.dateStart.getTime() + (hour * 60 + minute) * 60 * 1000
      )
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
        let time = new Date(
          prevTimePosition.time.getTime() + this.projectDuration * 60 * 1000
        )
        let findPosition = false
        let index = 1
        while (!findPosition) {
          let timeItem = this.timeList.find(
            x => x.time == time.toLocaleTimeString('en-GB').replace(/:00$/, '')
          )
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
          const position =
            time.toLocaleTimeString('en-GB').replace(/:00$/, '') + '-' + index
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
      timePositions.forEach(i => {
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
      this.selectedOrder.timePositions.forEach(x => {
        delete this.positionObj[x.position]
      })
      // this.assign()
    },
    deleteOrder() {
      let order = this.$algorithm.data.orderObj[this.selectedOrder.id]

      if (!order) {
        throw new Error('所选订单不存在!')
      }
      // 已分配的项目不能删除
      if (order.orderInfo.some(x => x.assignItemID)) {
        throw new Error('该订单存在已分配的项目，无法删除！')
      }

      const oldPositions = [...order.timePositions]
      order.timePositions.forEach(x => {
        delete this.positionObj[x.position]
      })
      this.$delete(this.orderObj, order.id)
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
      const r = await this.$confirm(
        '此操作将清空今日所有订单数据, 是否继续?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      if (r != 'confirm') return
      await window.IDB.delete('schedule', this.dateStart)
      // 删除 结账表checkoutList
      await this.$IDB.executeTransaction(['checkoutList'], 'readwrite', t => {
        const store = t.objectStore('checkoutList')
        const request = store.index('date').getAllKeys(this.dateStart)
        request.onsuccess = event => {
          const result = event.target.result
          if (result) {
            result.forEach(key => store.delete(key))
          }
        }
      })
      console.log('delete checkoutList success')
      this.$algorithm.initData()
    },
    judgeMove(oldPositions) {
      oldPositions.forEach(x => {
        if (!this.positionObj[x.position]) {
          this.MoveLeft(x)
        }
      })
    },
    MoveLeft(position) {
      // 取当前行该位置后的所有项目Object.keys().filter.sort，按顺序重新设置序号，再判断最后一个空位是否由满变空
      // 如果由满变空 取后面的项目依次判断能否上移，Object.keys().filter.sort
      // 然后再嵌套执行this.MoveLeft(x)
      const timeItem = this.timeList.find(x => x.time == position.timeStr)
      if (!timeItem) return
      const lastPosition = `${position.timeStr}-${timeItem.orderCount}`
      let lastPositionItem = null
      if (position.position == lastPosition) {
        lastPositionItem = position
      }
      lastPositionItem = lastPositionItem || this.positionObj[lastPosition]
      const moveList = Object.keys(this.positionObj)
        .filter(
          x =>
            this.positionObj[x].timeStr == position.timeStr &&
            this.positionObj[x].index > position.index
        )
        .sort((a, b) => this.positionObj[a].index - this.positionObj[b].index)
        .map(x => this.positionObj[x])
      for (let i = position.index; i <= timeItem.orderCount; i++) {
        let positionItem = moveList.shift()
        if (!positionItem) break
        let oldPosition = positionItem.position
        positionItem.position = `${positionItem.timeStr}-${i}`
        positionItem.index = i
        this.positionObj[positionItem.position] = positionItem
        delete this.positionObj[oldPosition]
        // set timePositions
        let timePositionItem = this.orderObj[
          positionItem.orderID
        ].timePositions.find(x => x.position == oldPosition)
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
        .filter(x => {
          let result = false
          const positionItem = this.positionObj[x]
          if (
            this.orderObj[positionItem.orderID] &&
            positionItem.timeStr > position.timeStr &&
            positionItem.number > 1
          ) {
            console.log(positionItem)
            let prevPositionItem = this.orderObj[positionItem.orderID]
              .timePositions[positionItem.number - 2]
            if (
              position.time - prevPositionItem.time >=
              this.projectDuration * 60 * 1000
            ) {
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
        .map(x => this.positionObj[x])
      if (moveList.length > 0) {
        let positionItem = moveList[0]
        this.selectedOrder = this.$clone(this.orderObj[positionItem.orderID])
        this.title = this.orderObj[
          positionItem.orderID
        ].timePositions[0].position
        this.orderSave('temp')
      }
    },
    getOrderCount(timeItem) {
      // if (timeItem.time == '20:45') debugger
      // console.log({ timeItem }, timeItem.orderCount)
      let orderCount = timeItem.orderCount
      let smallCount = Object.keys(this.positionObj).filter(x => {
        try {
          if (
            this.positionObj[x].timeStr == timeItem.time &&
            this.positionObj[x].index <= orderCount
          ) {
            let positionItem = this.positionObj[x]
            let order = this.orderObj[positionItem.orderID]
            let kind = order.orderInfo[positionItem.number - 1].kind
            if (kind.orderRule == '由后到前') {
              return true
            }
          }
        } catch (e) {}
        return false
      }).length

      while (smallCount > 0) {
        let count = 0
        for (let i = orderCount + 1; i <= smallCount + orderCount; i++) {
          let positionItem = this.positionObj[`${timeItem.time}-${i}`]
          if (positionItem) {
            try {
              let order = this.orderObj[positionItem.orderID]
              let kind = order.orderInfo[positionItem.number - 1].kind
              if (kind.orderRule == '由后到前') {
                count += 1
              }
            } catch (e) {}
          }
        }
        orderCount += smallCount
        smallCount = count
      }
      return orderCount
    },
    getOverFlowOrder(timeItem) {
      // 根据maxIndex 依次寻找溢出的项目
      // 或者用Object.keys()也可以一试
      return Object.keys(this.positionObj)
        .filter(
          x =>
            this.positionObj[x].timeStr == timeItem.time &&
            this.positionObj[x].index > this.getOrderCount(timeItem)
        )
        .sort((a, b) => this.positionObj[a].index - this.positionObj[b].index)
        .map(x => this.positionObj[x])
    },
    assign() {
      this.$algorithm.assign()
    },
    clickChange(id) {
      if (this.positionObj[id] && this.positionObj[id].number != 1) {
        return
      }
      if (this.changeList.includes(id)) {
        console.log('if')
        this.changeList = this.changeList.filter(x => x != id)
      } else if (this.changeList.length < 2) {
        console.log('else')
        this.changeList.push(id)
      }
    },
    async selectOrder(id) {
      if (this.showChange) {
        return this.clickChange(id)
      }

      this.title = id
      if (
        this.positionObj[this.title] &&
        this.orderObj[this.positionObj[this.title].orderID]
      ) {
        this.selectedOrder = this.$clone(
          this.orderObj[this.positionObj[this.title].orderID]
        )
      } else {
        if (this.lockedPosition.includes(id)) {
          await this.$confirm('该空格已被锁定, 是否解锁?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
          this.data.lockedPosition = this.lockedPosition.filter(x => x != id)
          window.algDataChange.scheduleDataChange()
          return
        }
        this.lockedPosition.push(id)
        window.algDataChange.scheduleDataChange()
        this.selectedOrder = { orderInfo: [], isArrive: 'notArrive' }
      }

      this.orderVisible = true
    }
  },
  computed: {
    unmatchOrderList() {
      // let unmatchOrderList = [...new Set(this.data.unmatchOrderList)]
      return this.data.unmatchOrderList.map(x => {
        let r = {}
        r.projects = x.waitingProjectList.map(m => m.project.name).join(',')
        r.count = x.order.orderInfo.length
        r.number = x.order.orderInfo.filter(f => f.assignItemID).length + 1
        r.orderName = x.order.name

        let timePositionItem = x.order.timePositions[r.number - 1]
        if (!timePositionItem) {
          return r
        }
        let index = x.order.timePositions[r.number - 1].index
        let position = x.order.timePositions[r.number - 1].time
          .toLocaleTimeString('en')
          .replace(/:00 [AP]M$/, '')
        r.position = `${position}-${index}`
        return r
      })
    },

    lockedPosition() {
      return this.data.lockedPosition
    },
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
      if (this.sortTtype == '按时间') {
        return this.data.assignList
          .slice(0)
          .sort((a, b) => b.timeEnd.getTime() - a.timeEnd.getTime())
      }
      return this.data.assignList
    }
  },
  watch: {
    orderVisible(val) {
      if (!val) {
        // console.log(this.title)
        this.data.lockedPosition = this.lockedPosition.filter(
          x => x != this.title
        )
        window.algDataChange.scheduleDataChange()
      }
    }
  }
}
</script>
<style scoped>
.page {
  background-color: #fff;
  color: #606266;
  font-size: 14px;
}
.clock-schedule {
  display: flex;
}
.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-left: 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 2px solid #ebeef5;
}
.unmatch-item {
  height: 43px;
  cursor: pointer;
  margin-top: 1px;
  flex: 1;
  padding: 7px 6px;
  /* border-radius: 4px; */
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  color: #ffffff;
  overflow: hidden;
  background: #909399;
}
.unmatch-item:hover {
  opacity: 0.8;
}
.setting-btn {
  font-size: 26px;
  font-weight: bolder;
  cursor: pointer;
}
.add-assign-item {
  position: absolute;
  left: 4px;
  font-size: 26px;
  font-weight: bolder;
  cursor: pointer;
}
.sort-type {
  font-size: 16px;
  padding-left: 4px;
  color: #409eff;
}
.sort-assign-item {
  position: absolute;
  right: 4px;
  font-size: 20px;
  font-weight: bolder;
  cursor: pointer;
}
.panel:last-child {
  margin-right: 10px;
}
.tech-list {
  flex: 0 0 155px;
  overflow: hidden;
}
.assign_list {
  flex: 0 0 220px;
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
.clock-schedule {
  overflow: hidden;
  margin-right: 10px;
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
  flex: 0 0 65px;
  text-align: right;
}
.tech-line.free-tech .tech-line-time {
  color: #fff;
}
.schedule-content {
  display: flex;
}
.schedule-time-content {
  z-index: 10;
  flex: 0 0 70px;
  position: sticky;
  left: 0;
}
.schedule-order-content {
  flex: 1;
  /* overflow-y: auto; */
}
.schedule-line-time-shadow {
  box-shadow: 4px 0 5px -3px rgba(0, 0, 0, 0.1);
}
.schedule-line-time {
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 60px;
  /* border-bottom: 2px solid #ebeef5; */
  color: #409eff;
  height: 80px;
}
.lock {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
}
.lock i {
  font-size: 45px;
}
.change-modal {
  /* z-index: 10; */
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: pointer;
}
.change-modal i {
  font-size: 26px;
  font-weight: bolder;
  color: #909399;
  position: absolute;
  right: 5px;
  top: 5px;
}
.unmatch-item .el-icon-error {
  margin-right: 5px;
  font-size: 16px;
}
.btn-line {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.schedule-line-order {
  position: relative;
  margin-left: 4px;
  margin-bottom: 4px;
  overflow: hidden;
  display: flex;
  flex: 0 0 220px;
  height: 76px;
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
.add-schedule i {
  font-size: 40px;
  color: #c0c4cc;
}

.add-schedule {
  cursor: pointer;
  flex: 0 0 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
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
.change-confirm-btn {
  position: absolute;
  left: 15px;
}
.change-cancel-btn {
  position: absolute;
  left: 110px;
}
.manage-btn {
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
