<template lang="pug">
  .page.col()
    .header Server
    ClockTable
</template>
<script>
import ClockTable from '@/components/ClockTable'

export default {
  components: {
    ClockTable
  },
  data() {
    return {}
  },
  created() {},
  methods: {}
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
