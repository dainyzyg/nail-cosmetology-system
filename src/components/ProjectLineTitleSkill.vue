<template lang="pug">
  .project-line
    .project-line-cell.title {{kind.name}}
    .project-line-cell.t 主要
    .project-line-cell.t 后备
    .project-line-cell.t 最后备
    .project-line-cell.time.t 标准时
    .project-line-cell.time.t 时调
    .project-line-cell.time.t 提成
</template>

<script>
export default {
  props: ['kind'],
  created() {},
  data() {
    return {}
  },
  methods: {},
  computed: {},
  watch: {}
}
</script>

<style scoped>
.project-line {
  display: flex;
  align-content: center;
}
.project-line:not(:last-child) {
  border-bottom: 1px solid #dcdfe6;
}
.project-line-cell {
  overflow: hidden;
  line-height: 14px;
  font-size: 12px;
  padding: 2px;
  flex: 0 0 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.project-line-cell.name {
  justify-content: flex-start;
}
.project-line-cell:not(:last-child) {
  border-right: 1px solid #dcdfe6;
}
.padding {
  margin-left: 10px;
}
.project-line-cell.toolbar {
  flex: 0 0 50px;
  display: flex;
  justify-content: space-around;
}
.project-line-cell.title {
  flex: 0 0 50px;
  font-weight: bolder;
  font-size: 16px;
}
.project-line-cell.time {
  flex: 0 0 20px;
}
.icon {
  color: #606266;
  font-size: 20px;
  cursor: pointer;
}
.icon.red {
  color: #f56c6c;
}
.t {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  writing-mode: vertical-lr;
}
</style>
