<template lang="pug">
  .project-line
    .project-line-cell.title.name(:class="{isProject:isProject}") {{data.name}}
    CheckCell.project-line-cell(v-model="skillItem.type" label="major" @change="save")
    CheckCell.project-line-cell(v-model="skillItem.type" label="minor" @change="save")
    CheckCell.project-line-cell(v-model="skillItem.type" label="sub" @change="save")
    .project-line-cell.time {{data.standardTime}}
    EditCell.project-line-cell.time(number v-model="skillItem.timeDiff" @change="save")
    EditCell.project-line-cell.time(number v-model="skillItem.percentage" @change="save")
</template>

<script>
import EditCell from '@/components/EditCell'
import CheckCell from '@/components/CheckCell'

export default {
  components: {
    EditCell,
    CheckCell
  },
  props: ['project', 'addition', 'technician'],
  created() {},
  data() {
    console.log('skill', this.skillInfo)
    return {
      skillItemTemp: {}
    }
  },
  methods: {
    save() {
      this.technician.skillInfo[this.data.id] = this.skillItem
      this.$IDB.put('technician', this.technician)
    }
  },
  computed: {
    skillItem() {
      return this.technician.skillInfo[this.data.id] || this.skillItemTemp
    },
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
.isProject {
  font-weight: bolder;
}
</style>
