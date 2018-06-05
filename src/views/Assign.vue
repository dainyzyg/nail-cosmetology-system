<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
        el-button(v-if="!openHistory" @click="openHistory=true" size="mini" close) detail
        template(v-if="openHistory")
          el-button(@click="prev" icon="el-icon-caret-left" size="mini" round)
          |  {{historyIndex}}/{{historyLength}}
          el-button(@click="next" icon="el-icon-caret-right" size="mini" round)
          el-button(@click="openHistory=false" icon="el-icon-close" size="mini" round)
      el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
    ClockTable(:assignObject="assignObject" :openHistory="openHistory" :historyIndex="historyIndex" @project-click="openInfo")
    el-dialog(title='订单详情' :visible.sync='setVisible')
      el-form(label-width="80px" :inline="true")
        .form-line {{selectedInfo}}
        el-form-item(label='开始时间')
          el-time-picker(v-model="selectedItem.timeStart" style="width:200px")
        el-form-item(label='结束时间')
          el-time-picker(v-model="selectedItem.timeEnd" style="width:200px")
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
import ClockTable from '@/components/ClockTable'

export default {
  components: {
    ClockTable
  },
  data() {
    return {
      assignObject: {
        technicianList: [],
        preAssignList: [],
        historyPreAssignList: [],
        dateNow: new Date()
      },
      selectedInfo: '',
      selectedItem: {},
      setVisible: false,
      dataTime: this.$algorithm.getDateNow(),
      preAssignList: [],
      technicianList: [],
      orderList: [],
      historyPreAssignList: [],
      setIntervalIndex: null,
      historyIndex: 1,
      openHistory: false
    }
  },
  async created() {
    window.ipcRenderer.on('asynchronous-reply', this.getData)
    // this.getTechnicianList()
    // this.setIntervalIndex = setInterval(() => {
    //   this.dataTime = this.$algorithm.getDateNow()
    //   console.log('-------------------------')
    //   console.log(this.dataTime)
    // }, 1000 * 60)
    this.getData()
    // this.assignpProjects()
  },
  beforeDestroy() {
    // clearInterval(this.setIntervalIndex)
    window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },
  methods: {
    prev() {
      if (this.historyIndex > 1) {
        this.historyIndex -= 1
      }
    },
    next() {
      if (this.historyIndex < this.historyLength) {
        this.historyIndex += 1
      }
    },
    async getData() {
      this.assignObject = await this.$algorithm.getAssignList()
    },
    async cancelAdjust() {
      const { orderID, projectID } = this.selectedItem
      await this.$IDB.delete('assign', [orderID, projectID])
      this.assignpProjects()
      this.setVisible = false
    },
    async assignpProjects() {
      this.$algorithm.assignpProjects()
    },
    async adjust() {
      console.log(this.selectedItem)

      this.selectedItem.isAdjust = true
      // this.selectedItem.timeEnd = new Date(
      //   this.selectedItem.timeStart.getTime() + this.selectedItem.duration * 60 * 1000
      // )
      await this.$IDB.put('assign', this.selectedItem)
      await Promise.all(
        this.assignObject.preAssignList
          .filter(
            (x) =>
              x.orderID == this.selectedItem.orderID &&
              x.projectID != this.selectedItem.projectID &&
              x.timeEnd <= this.selectedItem.timeStart
          )
          .map((f) => {
            console.log('filter', f)
            f.isAdjust = true
            return this.$IDB.put('assign', f)
          })
      )
      this.assignpProjects()
      this.setVisible = false
    },
    openInfo(selectedOject) {
      this.selectedInfo = selectedOject.selectedInfo
      this.selectedItem = selectedOject.selectedItem
      this.setVisible = true
    }
  },
  computed: {
    historyItem() {
      return this.historyPreAssignList[this.historyIndex]
    },
    historyLength() {
      return Object.keys(this.assignObject.historyPreAssignList).length
    }
  },
  watch: {}
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

.breadcrumb-wraper {
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex: 0 0 50px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eaeefb;
}
</style>
