<template lang="pug">
 el-dialog(title='空格管理' :visible.sync='dialogVisible' top="5vh")
  el-table.table(:data="data.timeList" border height="calc(90vh - 120px)")
    el-table-column(width="80" align="center" prop="time" label="时间")
    el-table-column(width="120" align="center" prop="orderCount" label="订单数量")
    el-table-column(width="120" align="center" label="原始订单数量")
      template(slot-scope='scope')
        span {{scope.row.originalCount||scope.row.orderCount}}
    el-table-column(align="center" label="添加数量")
      template(slot-scope='scope')
        el-input-number(size="medium" v-model="scope.row.addCount" :precision="0" :min="0" @change="change(scope.row,$event)")
</template>

<script>
export default {
  props: {
    data: {
      default: false
    },
    visible: {
      default: false
    }
  },
  created() { },
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    change(row, e) {
      if (isNaN(e)) {
        return
      }
      if (!row.originalCount) {
        row.originalCount = row.orderCount
      }
      row.addCount = e
      row.orderCount = row.originalCount + row.addCount
      this.data.customTimeCountObj[row.time] = row.addCount
    }
  },
  computed: {},
  watch: {
    visible(val) {
      this.dialogVisible = val
    },
    dialogVisible(val) {
      if (val) {
      }
      this.$emit('update:visible', val)
      this.$algorithm.saveScheduleData()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.bluecolor {
  color: aquamarine;
}
</style>
