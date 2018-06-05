<template lang="pug">
  .page.col(v-if="true")
    .header Server
    ClockTable(:assignObject="assignObject")
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
      }
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      this.assignObject = await this.$algorithm.getAssignList()
    }
  }
}
</script>
<style scoped>
.header {
  background: slategray;
  flex: 0 0 50px;
}
.content {
  flex: 1;
  display: flex;
}
</style>
