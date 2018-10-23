<template lang="pug">
  .page
    el-form(label-width="200px")
      el-form-item(label="当前时间")
        el-time-picker(v-model="dateTimeNow")
      el-form-item(label='必做提前计算时间')
        el-input-number(v-model="doAdvanceTime")
      //- el-form-item(label='用户等待时间')
      //-   el-input-number(v-model="waitingTime")
      el-form-item(label='指定技师提前计算时间')
        el-input-number(v-model="designatedTechAdvanceTime")
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
  'doAdvanceTime',
  'designatedTechAdvanceTime',
  'minorTime',
  'subTime',
  'priorityTime',
  'workBeginTime',
  'workEndTime',
  'weekendBeginTime',
  'weekendEndTime'
]
const watch = {}
timeArray.forEach((i) => {
  watch[i] = (val) => {
    localStorage[i] = val
  }
})
export default {
  data() {
    const data = {}
    timeArray.forEach((i) => {
      data[i] = localStorage[i]
    })
    return {
      ...data,
      dateTimeNow: localStorage.dateTimeNow ? new Date(localStorage.dateTimeNow) : new Date('2018/2/27')
    }
  },
  created() {},
  methods: {},
  watch: {
    ...watch,
    dateTimeNow(val) {
      localStorage.dateTimeNow = new Date(2018, 1, 26, val.getHours(), val.getMinutes(), val.getSeconds()).toISOString()
      this.$algorithm.timeDuration = 0
      this.$algorithm.assignpProjects()
    }
  }
}
</script>
<style scoped>
.page {
  padding: 50px;
}
.line {
  margin: 0 10px;
}
</style>
