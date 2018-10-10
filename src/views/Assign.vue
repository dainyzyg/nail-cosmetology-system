<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
    ClockTable(:data="data" :dataTime="dataTime")
</template>
<script>
import ClockTable from '@/components/ClockTable'

export default {
  components: {
    ClockTable
  },
  data() {
    return {
      dataTime: this.$algorithm.getDateNow(),
      data: this.$algorithm.data
    }
  },
  async created() {},

  methods: {},
  computed: {},
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
