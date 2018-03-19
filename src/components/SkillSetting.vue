<template lang="pug">
  .page
    .kind(v-for="i in 4")
      .kind-title
        |做手
        el-select.padding(placeholder="排钟规则" size="mini")
        el-select.padding(placeholder="预先级" size="mini")
      .project-wrapper
        .project(v-for="i in 6")
          .project-line
            .project-line-cell.title
            .project-line-cell.t 主要
            .project-line-cell.t 后备
            .project-line-cell.t 最后备
            .project-line-cell.t 标准时
            .project-line-cell.time.t 时调
            .project-line-cell.t 提成
          .project-line(v-for="i in 12")
            .project-line-cell.title 亚克去掉
            .project-line-cell
              //- el-checkbox
            .project-line-cell
              //- el-checkbox
            .project-line-cell
              //- el-checkbox
            .project-line-cell(contenteditable="true") 30
            .project-line-cell.time -10
            .project-line-cell 20
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
  padding: 4px;
}
.project {
  width: 180px;
  border: 1px solid #aaa;
  margin-bottom: 4px;
}
.project-empty {
  width: 180px;
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
}
.project-line-cell:not(:last-child) {
  border-right: 1px solid #dcdfe6;
}
.padding {
  padding-left: 10px;
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
</style>
