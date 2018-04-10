<template lang="pug">
 div aaaa
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
