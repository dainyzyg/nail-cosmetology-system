<template lang="pug">
  .page
    .kind(v-for="i in 4")
      .kind-title
        |做手
        el-select.padding(placeholder="排钟规则" size="mini")
        el-select.padding(placeholder="预先级" size="mini")
        el-button.padding(size="mini" type="primary") 添加项目
      .project-wrapper
        .project(v-for="i in 8")
          .project-line
            .project-line-cell.toolbar
              i.el-icon-circle-plus.icon
              i.el-icon-remove.icon
              i.el-icon-circle-close.icon.red
            .project-line-cell.time.t 金额
            .project-line-cell.t 必问
            .project-line-cell.time.t 标准时
          .project-line(v-for="j in i")
            .project-line-cell.title.name 亚克去掉
            .project-line-cell.title.name english
            .project-line-cell.time(contenteditable="true") 30
            .project-line-cell
              i.el-icon-check
            .project-line-cell.time 20
        .project-empty(v-for="i in 10")
</template>
<script>
export default {
  data() {
    return {}
  },
  created() {},
  methods: {}
}
</script>
<style scoped>
.page {
  display: block;
  padding: 5px;
  overflow-y: auto;
  background-color: #fafafa;
}
.kind {
  border-radius: 4px;
  /* box-shadow: 0 2px 7px rgba(0, 0, 0, 0.15); */
  border: 1px solid #ebebeb;
  margin-bottom: 5px;
  background-color: #fff;
}
.kind-title {
  /* line-height: 40px; */
  display: flex;
  align-items: center;
  padding-left: 5px;
  color: #1f2f3d;
  height: 32px;
  border-bottom: 1px solid #ebebeb;
}
.project-wrapper {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 4px;
}
.project {
  width: 175px;
  border: 1px solid #aaa;
  margin-bottom: 4px;
}
.project-empty {
  width: 175px;
  height: 0;
}
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
  flex: 0 0 105px;
  display: flex;
  justify-content: space-around;
}
.project-line-cell.title {
  flex: 0 0 50px;
}
.project-line-cell.time {
  flex: 0 0 20px;
}
.t {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  writing-mode: vertical-lr;
}
.project-line:nth-child(2) .project-line-cell.title.name {
  /* color: #66b1ff; */
  font-weight: bold;
}
.icon {
  color: #606266;
  font-size: 20px;
}
.icon.red {
  color: #f56c6c;
}
/* .el-icon-circle-plus.icon {
  color: #67c23a;
}
.el-icon-remove.icon{
  color: #909399;
} */
</style>
