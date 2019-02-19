<template lang="pug">
  .page
    el-menu.menu(mode="horizontal" :default-active='$router.currentRoute.path' :router='true')
      el-menu-item(index='/setting/parameterSettings') 参数配置
      el-menu-item(index='/setting/waitingConfig') 技师等待时间
      el-menu-item(index='/setting/rateConfig') 技师星级
      //- el-menu-item(index='/setting/technician') 排钟表
    router-view
</template>
<script>

export default {
  data() {
    return {

    }
  },
  created() { },
  methods: {},
  watch: {

  }
}
</script>
<style scoped>
.page {
  /* padding: 50px; */
  flex-direction: column;
}
.menu >>> .el-menu-item {
  /* font-size: 16px; */
  font-weight: bold;
}
</style>
