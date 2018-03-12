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
        el-table-column(align="center" label="出勤时间" width="250")
          template(slot-scope='scope')
            el-time-picker( v-model="attendanceInfo[scope.row.id].startTime" @change="saveAttendance(attendanceInfo[scope.row.id])")
        el-table-column(align="center" label="下班时间" width="250")
          template(slot-scope='scope')
            el-time-picker( v-model="attendanceInfo[scope.row.id].endTime" @change="saveAttendance(attendanceInfo[scope.row.id])")
</template>
<script>
export default {
  data() {
    return {
      attendanceInfo: {},
      dataTime: this.$algorithm.getDateNow(),
      tableData: []
    }
  },
  async created() {
    await this.getAttendanceInfo()
    this.getData()
  },
  methods: {
    async getAttendanceInfo() {
      const attendanceInfo = {}
      await this.$IDB.executeTransaction('attendance', 'readonly', t => {
        const store = t.objectStore('attendance')
        const request = store.index('date').openCursor(IDBKeyRange.only(this.dateBegin))
        request.onsuccess = event => {
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
        this.$IDB.put('attendance', info)
      } else {
        this.$IDB.delete('attendance', [info.id, info.date])
      }
    },
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction('technician', 'readonly', t => {
        const store = t.objectStore('technician')
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this.tableData.push(cursor.value)
            if (!this.attendanceInfo[cursor.value.id]) {
              this.$set(this.attendanceInfo, cursor.value.id, {
                startTime: this.workBeginTime,
                endTime: this.workEndTime,
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
