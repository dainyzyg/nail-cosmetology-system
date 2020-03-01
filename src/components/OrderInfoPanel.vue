<template lang="pug">
  .panel.flex-c(:style="{flex:flex}")
    .panel-header {{title}}
    .panel-content
      .panel-item.flex(v-for="item,index in data")
        .project-kind-wrapper.flex-c
          .kind {{item.kind.name}}
          .project {{item.project.name}}
          .close(@click="removeItem(index,item)")
            i.el-icon-close(style="font-size:18px")
        .addition-wrapper
          .technician(v-for="i in item.technicians") {{i.name}}
          .addition(v-for="i in item.additions") {{i.name}}
</template>

<script>
export default {
  props: {
    title: {
      default: ''
    },
    data: {
      default: () => []
    },
    flex: {
      default: '1'
    }
  },
  created() {},
  data() {
    return {}
  },
  methods: {
    removeItem(index, item) {
      console.log(item)
      if (item.assignItemID) {
        // throw new Error('已分配的项目无法删除！')
        this.$alert('已分配的项目无法删除！', '错误提示', {
          confirmButtonText: '确定',
          type: 'error'
        })
      } else {
        this.data.splice(index, 1)
      }
    }
  },
  computed: {},
  watch: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.kind,
.project {
  font-size: 14px;
  line-height: 35px;
  flex: 1;
  text-align: center;
  align-items: center;
  justify-content: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.kind {
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}
.skill-item {
  width: 83px;
  color: #409eff;
  padding: 10px 0;
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  background-color: rgba(64, 158, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  margin-bottom: 8px;
  /* background-color: hsla(220, 4%, 58%, 0.1);
  border-color: hsla(220, 4%, 58%, 0.2);
  color: #909399; */
  cursor: pointer;
}
.project-kind-wrapper {
  position: relative;
  color: #409eff;
  overflow: hidden;
  flex: 0 0 120px;
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  background-color: rgba(64, 158, 255, 0.1);
}
.close {
  position: absolute;
  width: 25px;
  height: 25px;
  top: 0;
  left: 0;
  cursor: pointer;
}
.technician {
  font-size: 12px;
  color: #e6a23c;
  border-radius: 4px;
  border: 1px solid rgba(230, 162, 60, 0.2);
  background-color: rgba(230, 162, 60, 0.1);
  height: 30px;
  line-height: 30px;
  padding: 0 5px;
  margin-left: 5px;
  margin-top: 2px;
}
.addition {
  font-size: 12px;
  color: #f56c6c;
  border-radius: 4px;
  border: 1px solid hsla(0, 87%, 69%, 0.2);
  background-color: hsla(0, 87%, 69%, 0.1);
  height: 30px;
  line-height: 30px;
  padding: 0 5px;
  margin-left: 5px;
  margin-top: 2px;
}
.addition-wrapper {
  display: flex;
  flex-wrap: wrap;
  /* background: rgba(103, 194, 58, 0.2); */
  flex: 1;
  overflow-y: auto;
}
.panel-item {
  height: 70px;
  margin-bottom: 10px;
}
.panel-content {
  /* background: saddlebrown; */
  padding: 10px;
  flex: 1;
  overflow-y: auto;
}
.panel-header {
  font-size: 17px;
  flex: 0 0 40px;
  line-height: 40px;
  background: #f5f7fa;
  margin: 0;
  padding-left: 15px;
  border-bottom: 1px solid #ebeef5;
  box-sizing: border-box;
  color: #000;
}

.panel {
  overflow: hidden;
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-right: 10px;
}
.panel:last-child {
  margin-right: 0;
}
</style>
