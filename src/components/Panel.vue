<template lang="pug">
  .panel.flex-c(:style="{flex:flex}")
    .panel-header {{title}}
    .panel-content
      slot
</template>

<script>
export default {
  props: {
    title: {
      default: ''
    },
    flex: {
      default: '1'
    }
  },
  created() {},
  data() {
    return {}
  },
  methods: {},
  computed: {},
  watch: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.selected {
  color: #409eff;
}
.panel-item {
  cursor: pointer;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 16px;
  line-height: 36px;
  padding-left: 15px;
}
.panel-content {
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
