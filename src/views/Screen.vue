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
      this.$algorithm.openWindow(screenName)
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
