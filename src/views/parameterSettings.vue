<template lang="pug">
  .page
    el-form(label-width="200px")
      //- el-form-item(label="当前时间")
      //-   el-time-picker(v-model="dateTimeNow")
      //- el-form-item(label='保底小费比例%')
      //-   el-input-number(v-model="miniFeePercent" :min="0" :max="100")
      el-form-item(label='真实时间')
        el-switch(v-model="realtime" @change="changeRealtime")
      el-form-item(label='当前日期' v-if="!realtime")
        el-date-picker(@change="dateChange" v-model="fixedDate")
      el-form-item(label='必做提前计算时间')
        el-input-number(v-model="doAdvanceTime")
      //- el-form-item(label='用户等待时间')
      //-   el-input-number(v-model="waitingTime")
      el-form-item(label='指定技师提前计算时间')
        el-input-number(v-model="designatedTechAdvanceTime")
      el-form-item(label='必做客户推后时间')
        el-input-number(v-model="doDelayTime")
      el-form-item(label='指定技师客户推后时间')
        el-input-number(v-model="designatedTechDelayTime")
      el-form-item(label='后备时间')
        el-input-number(v-model="minorTime")
      el-form-item(label='最后备时间')
        el-input-number(v-model="subTime")
      el-form-item(label='种类优先级调整时间')
        el-input-number(v-model="priorityTime")
      el-form-item(label='工作日上下班时间')
        el-input-number(v-model="workBeginTime")
        span.line -
        el-input-number(v-model="workEndTime")
      el-form-item(label='周末上下班时间')
        el-input-number(v-model="weekendBeginTime")
        span.line -
        el-input-number(v-model="weekendEndTime")
</template>
<script>
const timeArray = [
  // 'miniFeePercent',
  'doAdvanceTime',
  'designatedTechAdvanceTime',
  'doDelayTime',
  'designatedTechDelayTime',
  'minorTime',
  'subTime',
  'priorityTime',
  'workBeginTime',
  'workEndTime',
  'weekendBeginTime',
  'weekendEndTime'
]
const watch = {}
timeArray.forEach(i => {
  watch[i] = val => {
    localStorage[i] = val
    // window.algorithm.initData()
  }
})
export default {
  data() {
    const data = {}
    timeArray.forEach(i => {
      data[i] = localStorage[i]
    })
    let realtime = localStorage.realtime == 'true'
    let fixedDate = new Date(localStorage.dateTimeNow || '2018/2/26')
    return {
      fixedDate,
      realtime,
      ...data,
      dateTimeNow: localStorage.dateTimeNow
        ? new Date(localStorage.dateTimeNow)
        : new Date('2018/2/26')
    }
  },
  created() {},
  methods: {
    async dateChange() {
      let localDateTimeNow = new Date(localStorage.dateTimeNow || '2018/2/26')
      localStorage.dateTimeNow = new Date(
        this.fixedDate.getFullYear(),
        this.fixedDate.getMonth(),
        this.fixedDate.getDate(),
        localDateTimeNow.getHours(),
        localDateTimeNow.getMinutes(),
        localDateTimeNow.getSeconds()
      ).toISOString()
      this.$algorithm.timeDuration = 0
      await this.$algorithm.initData()
      window.algDataChange.scheduleDataChange()
    },
    async changeRealtime(val) {
      localStorage.realtime = val
      await this.$algorithm.initData()
      window.algDataChange.scheduleDataChange()
    }
  },
  watch: {
    ...watch,
    dateTimeNow(val) {
      localStorage.dateTimeNow = new Date(
        2018,
        1,
        26,
        val.getHours(),
        val.getMinutes(),
        val.getSeconds()
      ).toISOString()
      this.$algorithm.timeDuration = 0
      this.$algorithm.initData()
    }
  }
}
</script>
<style scoped>
.page {
  padding: 50px;
  overflow-y: auto;
}
.line {
  margin: 0 10px;
}
</style>
