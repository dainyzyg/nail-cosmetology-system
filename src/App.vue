<template lang="pug">
  .page-wraper.flex
    .nav-menu
      el-menu.menu(:default-active='$router.currentRoute.path', :router='true', background-color='#304156', text-color='#a7b1c2', active-text-color='#fff')
        el-menu-item(index='/clockschedule')
          i.el-icon-time
          span(slot='title') 排钟表
        el-menu-item(index='/order')
          i.el-icon-tickets
          span(slot='title') 结账
        el-menu-item(index='/report')
          i.el-icon-document
          span(slot='title') 报表
        el-menu-item(index='/assign')
          i.el-icon-time
          span(slot='title') 排钟查看
        el-menu-item(index='/project')
          i.el-icon-edit-outline
          span(slot='title') 项目管理
        el-menu-item(index='/technician')
          i.el-icon-edit-outline
          span(slot='title') 技师管理
        el-menu-item(index='/attendance')
          i.el-icon-date
          span(slot='title') 出勤管理
        el-menu-item(index='/screen')
          i.el-icon-picture
          span(slot='title') 屏幕管理
        el-menu-item(index='/fee')
          i.el-icon-goods
          span(slot='title') 小费设置
        el-menu-item(index='/workingTable')
          i.el-icon-menu
          span(slot='title') 工作台设置
        el-menu-item(index='/setting')
          i.el-icon-setting
          span(slot='title') 设置
        el-menu-item(index='/server')
          i.el-icon-upload
          span(slot='title') 服务器
    router-view
</template>

<script>
export default {
  name: 'App',
  errorCaptured() {
    console.log('errorCaptured')
  }
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
.el-menu-item [class^="el-icon-"] {
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
  overflow-y: auto;
  background-color: #304156;
}
</style>
