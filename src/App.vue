<template lang="pug">
  .page-wraper.flex
    .nav-menu
      el-menu.menu(:default-active='$router.currentRoute.path', :router='true', background-color='#304156', text-color='#a7b1c2', active-text-color='#fff')
        el-menu-item(index='/order')
          i.el-icon-tickets
          span(slot='title') 订单管理
        el-menu-item(index='/assign')
          i.el-icon-time
          span(slot='title') 排钟查看
        el-menu-item(index='/project')
          i.el-icon-edit-outline
          span(slot='title') 项目管理
        el-menu-item(index='/technician')
          i.el-icon-setting
          span(slot='title') 技师管理
        el-menu-item(index='/attendance')
          i.el-icon-date
          span(slot='title') 出勤管理
        el-menu-item(index='/setting')
          i.el-icon-setting
          span(slot='title') 设置
    router-view
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.menu {
  border-right: none;
}
.menu li {
  height: 70px;
  line-height: 70px;
  font-size: 16px;
}
.menu .is-active {
  background-color: #263445 !important;
}
.el-menu-item [class^='el-icon-'] {
  font-size: 20px;
  font-weight: bold;
  padding-top: 1px;
  margin-right: 8px;
}
.page-wraper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.nav-menu {
  flex: 0 0 145px;
  background-color: #304156;
}
</style>
