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
        .project-item(v-for="pi in getWorkList(t.id)" :style="getPIStyle(pi)")
          .project-item-line(v-for="i in getOrderInfo(pi)") {{i}}
      .time-now(:style="{left:getTimeNow()}")

</template>
<script>
export default {
  data() {
    return {
      technicianList: [
        {
          name: '技师1',
          id: 1
          // lastWorkTime:null,
        },
        {
          name: '技师2',
          id: 2,
          lastWorkTime: new Date('2018/1/5')
        }
        // {
        //   name: '技师3',
        //   id: 3,
        //   lastWorkTime: new Date('2018/1/10')
        // }
      ],
      technicianListSort: [],
      dataTime: new Date('2018/2/27'),
      orderList: [],
      freeTimeList: [],
      workListObj: {},
      firstQueueTime: {}
    }
  },
  created() {
    this.assignpProjects()
    // setInterval(() => {
    //   this.dataTime = new Date(this.dataTime.getTime() + 60 * 60 * 1000)
    // }, 1000)
  },
  methods: {
    getTimeString(date) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return `${hours}:${minutes}`
    },
    getOrderInfo(pi) {
      const list = []
      const duration = 45 * 60 * 1000
      const totalIndex = pi.order.orderInfo.length
      const index = pi.order.orderInfo.indexOf(pi.project) + 1
      const time = `${this.getTimeString(pi.project.preorderTime)}-${this.getTimeString(
        new Date(pi.project.preorderTime.getTime() + duration)
      )}`
      let additions = ''
      pi.project.additions.forEach(a => {
        additions += `${a.name} `
      })
      list.push(`${pi.order.name} ${index}/${totalIndex}项`)
      list.push(`${time}`)
      list.push(`${pi.project.project.name} ${additions}`)
      return list
    },
    getTimeNow() {
      const beginTime = new Date(this.dateBegin.getTime() + 11 * 60 * 60 * 1000)
      const endTime = new Date(this.dateBegin.getTime() + 21 * 60 * 60 * 1000)
      const duration = endTime - beginTime
      const start = this.dateNow - beginTime
      const left = start / duration
      return `calc(59px + (100% - 63px) * ${left})`
    },
    getWorkList(id) {
      console.log('getWorkList', this.workListObj[id])
      return this.workListObj[id]
    },
    getPIStyle(pi) {
      const duration = 45 * 60 * 1000
      const beginTime = new Date(this.dateBegin.getTime() + 11 * 60 * 60 * 1000)
      const endTime = new Date(this.dateBegin.getTime() + 21 * 60 * 60 * 1000)
      const totalDuration = endTime - beginTime
      const start = pi.project.preorderTime - beginTime
      const left = start / totalDuration
      const width = duration / totalDuration
      return {
        left: `calc(59px + (100% - 60px) * ${left})`,
        width: `calc((100% - 60px) * ${width} + 1px)`
      }
    },
    async assignpProjects() {
      this.technicianList.forEach(i => {
        this.technicianListSort.push({
          technician: i,
          startTime: i.lastWorkTime || new Date(0)
        })
      })
      await this.getData()
      const orderListSort = []
      this.orderList.forEach(order => {
        order.orderInfo.forEach((project, index) => {
          const orderItem = {
            order,
            project
          }
          if (index > 0) {
            orderItem.preProject = order.orderInfo[index - 1]
          }
          orderListSort.push(orderItem)
        })
      })
      console.time('a')
      const r = this.assign(this.technicianListSort, orderListSort, 1)
      console.timeEnd('a')
      this.workListObj = r.workListObj
      console.log(r)
    },
    assignItem(technicianItem, orderItem, technicianList, workListObj, times) {
      // console.log('assignItem')
      const duration = 45 * 60 * 1000
      const preorderTime = orderItem.preProject
        ? new Date(orderItem.preProject.preorderTime.getTime() + duration)
        : orderItem.order.preorderTime

      const beginTime = [this.dateNow, preorderTime, technicianItem.startTime].sort((a, b) => b - a)[0]

      // 判断是否推迟了15分钟
      for (let i = 1; i < times; i++) {
        if (!this.firstQueueTime[i]) {
          continue
        }
        const firstQueueTime = this.firstQueueTime[i][`${orderItem.order.id}${orderItem.project.project.id}`]
        if (firstQueueTime && beginTime - firstQueueTime > 15 * 60 * 1000) {
          console.log('判断是否推迟了15分钟')
          return false
        }
      }

      workListObj[technicianItem.technician.id] = workListObj[technicianItem.technician.id] || []
      orderItem.project.preorderTime = beginTime
      // technicianItem.technician.lastWorkTime = technicianItem.technician.lastWorkTime || new Date(0)
      const lastTime = this.dateNow - technicianItem.startTime > 0 ? this.dateNow : technicianItem.startTime
      if (beginTime - lastTime > 0) {
        const freeTechnicianItem = {
          freeTime: {
            timeBegin: lastTime,
            timeEnd: beginTime
          },
          startTime: lastTime,
          technician: technicianItem.technician
        }
        technicianList.push(freeTechnicianItem)
      }
      workListObj[technicianItem.technician.id].push(orderItem)
      // technicianItem.technician.lastWorkTime = new Date(orderItem.project.preorderTime.getTime() + duration)
      technicianItem.startTime = new Date(orderItem.project.preorderTime.getTime() + duration)
      this.firstQueueTime[times] = this.firstQueueTime[times] || {}
      this.firstQueueTime[times][`${orderItem.order.id}${orderItem.project.project.id}`] = beginTime
      return true
    },
    assign(technicianList, orderList, times) {
      // const orignTechnicianList = [...technicianList]
      // const orignOrderList = [...orderList]
      const duration = 45 * 60 * 1000
      const workListObj = {}
      for (let orderItem of orderList) {
        this.sort(technicianList, 'startTime')
        const preorderTime = orderItem.preProject
          ? new Date(orderItem.preProject.preorderTime.getTime() + duration)
          : orderItem.order.preorderTime
        for (let technicianItem of technicianList) {
          console.log(technicianItem)
          console.log(orderItem)
          if (!technicianItem.freeTime) {
            // console.log('if')
            // 不插队
            if (this.assignItem(technicianItem, orderItem, technicianList, workListObj, times)) {
              break
            } else {
              return { success: false }
            }
          } else if (
            this.dateNow >= technicianItem.freeTime.timeEnd ||
            preorderTime >= technicianItem.freeTime.timeEnd
          ) {
            // console.log('else if')
            // 空隙失效
            continue
          } else {
            // 调整orderList顺序重新排
            // console.log('else')
            const newTechnicianList = []
            this.technicianList.forEach(i => {
              newTechnicianList.push({
                technician: i,
                startTime: i.lastWorkTime || new Date(0)
              })
            })
            // 调整订单顺序
            const newOrderList = [...orderList]
            const adjustOrderItem = workListObj[technicianItem.technician.id].find(
              item => item.project.preorderTime >= technicianItem.freeTime.timeEnd
            )
            const orderIndex = newOrderList.indexOf(orderItem)
            newOrderList.splice(orderIndex, 1)
            const adjustIndex = newOrderList.indexOf(adjustOrderItem)
            newOrderList.splice(adjustIndex, 0, orderItem)
            // 重新排序
            const r = this.assign(newTechnicianList, newOrderList, times + 1)
            console.log(r)
            if (r.success) {
              return r
            }
            continue
          }
        }
      }
      return { workListObj, success: true }
    },
    sort(array, field) {
      array.sort((a, b) => a[field] - b[field])
    },
    async getData() {
      this.orderList = []
      await this.$IDB.executeTransaction(['order'], 'readonly', t => {
        const store = t.objectStore('order')
        const request = store.index('orderDate').openCursor(IDBKeyRange.bound(this.dateBegin, this.dateEnd))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this.orderList.push(cursor.value)
            cursor.continue()
          }
        }
      })
    }
  },
  computed: {
    dateNow() {
      return new Date(this.dateBegin.getTime() + 11 * 60 * 60 * 1000)
    },
    dateBegin() {
      return new Date(this.dataTime.toDateString())
    },
    dateEnd() {
      return new Date(this.dateBegin.getTime() + 24 * 60 * 60 * 1000 - 1)
    }
  }
}
</script>
<style scoped>
.project-item {
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
