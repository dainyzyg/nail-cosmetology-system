<template lang="pug">
  .page
    div
      el-button(type="primary" @click="open('big-screen')") 打开大屏显示
      el-button(type="primary" @click="open('fee-screen')") 打开小费显示
</template>
<script>
export default {
  data() {
    return {}
  },
  created() {},
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
  padding: 50px;
}
</style>
