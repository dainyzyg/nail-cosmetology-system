<template lang="pug">
  .project-line
    EditCell.project-line-cell.title.name(:class="{isProject:isProject}" v-model="data.name" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
    EditCell.project-line-cell.title.name(v-model="data.englishName" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
    EditCell.project-line-cell.time(number v-model="data.price" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
    CheckCell.project-line-cell(v-model="data.ask" @change="save")
    CheckCell.project-line-cell(v-model="data.do" @change="save")
    EditCell.project-line-cell.time(number v-model="data.standardTime" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
    EditCell.project-line-cell.time(number v-model="data.commision" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
    EditCell.project-line-cell.index(number v-model="data.index" @change="save" @focus="$emit('focus')" @blur="$emit('blur')")
</template>

<script>
import EditCell from '@/components/EditCell'
import CheckCell from '@/components/CheckCell'

export default {
  components: {
    EditCell,
    CheckCell
  },
  props: ['project', 'addition'],
  created() { },
  data() {
    return {}
  },
  methods: {
    save() {
      console.log('save line', this.data)
      const store = this.project ? 'project' : 'addition'
      this.$IDB.put(store, this.data)
    }
  },
  computed: {
    data() {
      return this.project || this.addition
    },
    isProject() {
      if (this.project) {
        return true
      }
      return false
    }
  },
  watch: {}
}
</script>

<style scoped>
.project-line {
  position: relative;
  display: flex;
  align-content: center;
}
.project-line:not(:last-child) {
  border-bottom: 1px solid #dcdfe6;
}
.project-line-cell {
  word-break: break-all;
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
.project-line-cell.index {
  flex: 0 0 30px;
}
.isProject {
  font-weight: bolder;
}
</style>
