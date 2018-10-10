<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(align="center" width="80" label="出勤")
          template(slot-scope='scope')
            el-switch(v-model="attendanceInfo[scope.row.id].isAttend" @change="saveAttendance(attendanceInfo[scope.row.id])")
        el-table-column(prop="name" label="姓名")
        el-table-column(align="center" label="午餐时间" width="150")
          template(slot-scope='scope')
            el-time-select(style="width:120px" :picker-options="pickerOpions" v-model="attendanceInfo[scope.row.id].lunchTime" @change="saveAttendance(attendanceInfo[scope.row.id])")
        el-table-column(align="center" label="午餐时长" width="160")
          template(slot-scope='scope')
            //- el-input-number(style="width:130px" v-model="attendanceInfo[scope.row.id].lunchTimeDuration")
            el-select(style="width:130px" v-model="attendanceInfo[scope.row.id].lunchTimeDuration" @change="saveAttendance(attendanceInfo[scope.row.id])")
              el-option(:label="15" :value="15")
              el-option(:label="30" :value="30")
              el-option(:label="45" :value="45")
        el-table-column(align="center" label="出勤时间" width="150")
          template(slot-scope='scope')
            el-time-select(style="width:120px" :picker-options="getStartPickerOpions(attendanceInfo[scope.row.id].endTime)" v-model="attendanceInfo[scope.row.id].startTime" @change="saveAttendance(attendanceInfo[scope.row.id])")
        el-table-column(align="center" label="下班时间" width="150")
          template(slot-scope='scope')
            el-time-select(style="width:120px" :picker-options="getEndPickerOpions(attendanceInfo[scope.row.id].startTime)" v-model="attendanceInfo[scope.row.id].endTime" @change="saveAttendance(attendanceInfo[scope.row.id])")
</template>
<script>
export default {
  data() {
    return {
      attendanceInfo: {},
      dataTime: this.$algorithm.getDateStart(),
      tableData: [],
      pickerOpions: {
        start: this.$algorithm
          .workBeginTime()
          .toLocaleTimeString('en-GB')
          .replace(/:00$/, ''),
        step: '00:15',
        end: this.$algorithm
          .workEndTime()
          .toLocaleTimeString('en-GB')
          .replace(/:00$/, '')
      }
    }
  },
  async created() {
    await this.getAttendanceInfo()
    this.getData()
  },
  methods: {
    getEndPickerOpions(startTime) {
      return {
        minTime: startTime,
        ...this.pickerOpions
      }
    },
    getStartPickerOpions(endTime) {
      return {
        maxTime: endTime,
        ...this.pickerOpions
      }
    },
    async getAttendanceInfo() {
      const attendanceInfo = {}
      await this.$IDB.executeTransaction('attendance', 'readonly', (t) => {
        const store = t.objectStore('attendance')
        const request = store.index('date').openCursor(IDBKeyRange.only(this.dateBegin))
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            attendanceInfo[cursor.value.id] = cursor.value

            cursor.continue()
          }
        }
      })
      this.attendanceInfo = attendanceInfo
    },
    saveAttendance(info, id) {
      console.log(info)
      if (info.isAttend) {
        // 计算午餐结束时间
        const hour = parseInt(info.lunchTime.split(':')[0])
        const minute = parseInt(info.lunchTime.split(':')[1])
        const lunchTimeStart = new Date(this.dataTime.getTime() + (hour * 60 + minute) * 60 * 1000)
        const lunchTimeEnd = new Date(lunchTimeStart.getTime() + info.lunchTimeDuration * 60 * 1000)
        info.lunchTimeEnd = lunchTimeEnd.toLocaleTimeString('en-GB').replace(/:00$/, '')

        this.$IDB.put('attendance', info)
      } else {
        this.$IDB.delete('attendance', [info.id, info.date])
      }
    },
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction('technician', 'readonly', (t) => {
        const store = t.objectStore('technician')
        const request = store.index('index').openCursor()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            this.tableData.push(cursor.value)
            if (!this.attendanceInfo[cursor.value.id]) {
              this.$set(this.attendanceInfo, cursor.value.id, {
                lunchTime: '12:00',
                lunchTimeDuration: 30,
                startTime: this.$algorithm
                  .workBeginTime()
                  .toLocaleTimeString('en-GB')
                  .replace(/:00$/, ''),
                endTime: this.$algorithm
                  .workEndTime()
                  .toLocaleTimeString('en-GB')
                  .replace(/:00$/, ''),
                isAttend: false,
                id: cursor.value.id,
                date: this.dateBegin
              })
            }
            cursor.continue()
          }
        }
      })
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
      this.attendanceInfo = {}
      this.tableData = []
      await this.getAttendanceInfo()
      this.getData()
    }
  }
}
</script>
<style scoped>
.row {
  height: 50px;
  width: 400px;
  border: 1px solid #999;
}
.draghandle {
  font-size: 25px;
  font-weight: bolder;
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
  background-color: #fafafa;
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-radius: 5px;
}
</style>
<style>
.table-cell {
  padding: 2px 0 !important;
}
</style>
