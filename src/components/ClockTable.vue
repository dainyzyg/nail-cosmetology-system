<template lang="pug">
  .wrapper(ref="wrapper")
    .header(:style="{width:zoom}")
      .empty
      .mark-wrapper
        .mark-content(style="width:100%")
          .mark-item(v-for="i in timeSlot") {{i}}
    .content(:style="{width:zoom}")
      .left
        .line.name(v-for="i in assignList") {{i.techName}}
      .right
        .clock-wrapper(style="width:100%")
          //- .time-now(:style="{left:getTimeNow()}")
          .line(v-for="i in assignList")
            .project-item(v-for="pi in getWorkList(i.techID)" :style="getPIStyle(pi)")
              .project-item-line(v-for="i in getOrderInfo(pi)") {{i}}
            .hour(v-for="i in timeSlot")
              .half-hour(v-for="i in 2")
                .quarter-hour(v-for="i in 2")
                  .five-minutes(v-for="i in 3")
</template>

<script>
export default {
  props: ['data', 'dataTime'],
  created() { },
  data() {
    return {
      zoom: '300%'
    }
  },
  methods: {
    async getData() {
      const r = await this.$algorithm.getAssignList()
      this.technicianList = r.technicianList
      this.preAssignList = r.preAssignList
      this.historyPreAssignList = r.historyPreAssignList
      this.dataTime = r.dateNow
    },
    getTimeNow() {
      const beginTime = this.workBeginTime
      const endTime = this.workEndTime
      const duration = endTime - beginTime
      const start = this.dataTime - beginTime
      const left = (start / duration) * 100
      return `calc(${left}% - 1px)`
    },
    getWorkList(id) {
      let list = []
      try {
        list = this.assignList.find((x) => x.techID == id).assignList
      } finally {
      }
      return list
    },
    getTimeString(date) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return this.formatTime(`${hours}:${minutes}`)
    },
    formatTime(str) {
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
      return `${hours}:${minutes} ${meridiem}`
    },
    getOrderInfo(pi) {
      const list = []
      const time = `${this.getTimeString(pi.timeStart)}-${this.getTimeString(pi.timeEnd)}`
      list.push(`${pi.number}/${pi.count} ${pi.orderName}`)
      list.push(`${time}`)
      list.push(`${pi.projectName}`)
      return list
    },
    getPIStyle(pi) {
      const duration = pi.timeEnd - pi.timeStart
      const beginTime = this.workBeginTime
      const endTime = this.workEndTime
      const totalDuration = endTime - beginTime
      const start = pi.timeStart - beginTime
      const left = (start / totalDuration) * 100
      const width = (duration / totalDuration) * 100
      let background = '#67c23a' // 绿
      if (pi.isAdjust) {
        background = '#909399' // 灰
      }

      switch (pi.status) {
        case 'fix':
          background = '#13c2c2'
          break
        case 'start':
          background = '#f5222d'
          break
        case 'end':
          background = '#fadb14'
          break
        case 'checkout':
          background = '#fe9403'
          break
        case 'waiting':
          background = '#52c41a'
          break
        case 'advance':
          background = '#1890ff'
          break
      }
      return {
        left: `calc(${left}% - 1px)`,
        width: `calc(${width}% + 1px)`,
        background
      }
    },
    clone(obj) {
      return JSON.parse(JSON.stringify(obj), (k, v) => {
        if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
          return new Date(v)
        }
        return v
      })
    }
  },
  computed: {
    assignList() {
      const m = new Map()
      this.data.assignList.concat(this.data.preAssignList).forEach((item) => {
        if (m.has(item.techID)) {
          m.get(item.techID).assignList.push(item)
        } else {
          m.set(item.techID, {
            techID: item.techID,
            techName: item.techName,
            assignList: [item]
          })
        }
      })
      console.log([...m.values()])
      return [...m.values()]
    },
    dateBegin() {
      return new Date(this.dataTime.toDateString())
    },
    beginHour() {
      const day = this.dataTime.getDay()
      if (day > 0 && day < 6) {
        return parseInt(localStorage.workBeginTime)
      } else {
        return parseInt(localStorage.weekendBeginTime)
      }
    },
    endHour() {
      const day = this.dataTime.getDay()
      if (day > 0 && day < 6) {
        return parseInt(localStorage.workEndTime)
      } else {
        return parseInt(localStorage.weekendEndTime)
      }
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
    },
    timeSlot() {
      const arr = []
      for (let i = this.beginHour; i < this.endHour; i++) {
        arr.push(i)
      }
      return arr
    },
    techList() {
      return []
    }
  },
  watch: {}
}
</script>

<style scoped>
.line {
  border-bottom: 1px solid slategray;
  background: white;
  height: 50px;
  display: flex;
  position: relative;
}
.line.name {
  justify-content: center;
  align-items: center;
  border-left: 1px solid slategray;
  border-right: 1px solid slategray;
}
.wrapper {
  margin: 5px;
  flex: 1;
  /* display: flex; */
  overflow: auto;
  /* flex-direction: column; */
  color: #606266;
}
.header {
  z-index: 200;
  position: sticky;
  top: 0px;
  flex: 0 0 20px;
  display: flex;
}
.empty {
  position: sticky;
  left: 0px;
  flex: 0 0 100px;
  background: white;
  border-bottom: 1px solid slategray;
}
.mark-wrapper {
  flex: 1;
  border-bottom: 1px solid slategray;
}
.content {
  flex: 1;
  display: flex;
}
.left {
  position: sticky;
  left: 0px;
  flex: 0 0 80px;
  z-index: 100;
}
.right {
  flex: 1;
}
.clock-wrapper {
  position: relative;
}
.mark-content {
  height: 100%;
  background: white;
  display: flex;
  border-bottom: 1px solid slategray;
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
/* .hour:first-child {
  border-left: 1px solid #909399;
} */
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
  top: 0;
  bottom: 0;
  /* left: calc(25% - 1px); */
  width: 2px;
  background: orangered;
  position: absolute;
  z-index: 1;
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
</style>
