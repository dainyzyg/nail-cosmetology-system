<template lang="pug">
  .panel.flex-c(:style="{flex:flex}")
    .panel-header {{title}}
    .panel-content
      .panel-item(v-for="i in data" @click="selectItem(i)" :class="{selected:isSelected(i.id)}") {{i.name}}
</template>

<script>
export default {
  props: {
    title: {
      default: ''
    },
    data: {
      default: []
    },
    flex: {
      default: '1'
    },
    muti: {
      default: false
    },
    selectedItem: {
      default: () => {
        return {}
      }
    },
    selectedItems: {
      default: () => {
        return []
      }
    }
  },
  created() {},
  data() {
    return {
      selectedID: null,
      selectedIDs: []
    }
  },
  methods: {
    selectItem(item) {
      if (this.muti) {
        // debugger
        const index = this.selectedItems.findIndex(i => i.id == item.id)
        if (index < 0) {
          this.selectedItems.push(item)
        } else {
          this.selectedItems.splice(index, 1)
        }
        // this.$emit('update:selectedItems', item)
      } else {
        this.$emit('update:selectedItem', item)
      }
    },
    isSelected(id) {
      if (this.muti) {
        return this.selectedItems.find(i => i.id == id)
      }
      return this.selectedItem.id == id
    }
  },
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
