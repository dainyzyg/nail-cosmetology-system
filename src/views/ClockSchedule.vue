<template lang="pug">
  .page
    el-table.table(height="calc(100vh - 16px)" border ref="table1" :data="tableData" :show-header="false")
      el-table-column(fixed="left" prop="time" width="75")
      el-table-column(prop="project1" :key="i" v-for="i in 5" width="180")
         template(slot-scope="scope")
          .project-wrapper
            .line
              .order-name ordername
              .num 1/3
            .line asd
</template>
<script>
export default {
  data() {
    return {
      tableData: [
        { time: '2016-1-1', project1: 'project1', project2: 'project2', project3: 'project3', project4: 'project4' },
        { time: '2016-1-1', project1: 'project1', project2: 'project2', project3: 'project3', project4: 'project4' },
        { time: '2016-1-1', project1: 'project1', project2: 'project2', project3: 'project3', project4: 'project4' }
      ]
    }
  },
  created() {
    const workBeginTime = this.$algorithm.workBeginTime()
    const workEndTime = this.$algorithm.workEndTime()
    const tableData = []
    let workTime = new Date(workBeginTime)
    while (workTime < workEndTime) {
      tableData.push({ time: workTime.toLocaleTimeString('en-GB') })
      workTime = new Date(workTime.getTime() + 15 * 60 * 1000)
    }
    this.tableData = tableData
  },
  methods: {
    open(screenName) {
      if (screenName == 'fee-screen') {
        this.$algorithm.openWindow(screenName, { width: 1024, height: 768 })
      } else {
        this.$algorithm.openWindow(screenName, { width: 1024, height: 768 })
      }
    }
  },
  watch: {}
}
</script>
<style scoped>
.page {
  background-color: #fafafa;
}
.table {
  flex: 1;
  margin: 8px;
}
.project-wrapper {
  width: 100%;
  /* background: saddlebrown; */
}
.project-wrapper .line {
  height: 20px;
  display: flex;
  align-items: center;
  margin-left: 3px;
}
.order-name {
  flex: 1;
}
.num {
  flex: 0 0 30px;
  /* background: saddlebrown; */
}
.el-table >>> td {
  padding: 0px;
}
.el-table >>> .cell {
  padding: 0px;
}
</style>
