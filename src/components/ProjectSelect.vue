<template lang="pug">
.tab-content.flex
  .project
    .skill-item(@click="selectSkill(item)" v-for="item in projectList" :key="item.id" :class="{select:selectProject.id==item.id,get:hasSkill(item.id)}")
      .skill-item-text {{item.name}}
  .skill
    el-table(style="flex:0 0 690px;" :data="skillList" height="calc(90vh - 318px)" header-row-class-name="hrcn" :row-class-name="tableRowClassName")
      el-table-column(align="center" width="80")
          template(slot-scope='scope')
            el-switch(v-model="scope.row.skillInfo.hasSkill" @change="skillChange(scope.row,$event)")
      el-table-column(prop="name" label="名称" width="200")
      el-table-column(align="center" width="250" label="类型")
          template(slot-scope='scope')
            el-radio(v-model="scope.row.skillInfo.type" label="major") 主力
            el-radio(v-model="scope.row.skillInfo.type" label="minor") 后备
            el-radio(v-model="scope.row.skillInfo.type" label="sub") 最后备
      el-table-column(align="center" width="90" label="时间(分钟)")
          template(slot-scope='scope')
            el-input-number(v-model="scope.row.skillInfo.time" :controls="false" :max="999" style="width:55px;" size="small" auto-complete='off')
      el-table-column(align="center" width="80" label="提成(%)")
          template(slot-scope='scope')
            el-input-number(v-model="scope.row.skillInfo.percentage" :controls="false" :max="100" style="width:48px;" size="small" auto-complete='off')
</template>

<script>
export default {
  props: {
    kind: {
      default: {}
    },
    skills: {
      default: {}
    }
  },
  created() {
    this.getProjectList()
  },
  data() {
    return {
      selectProject: { skillInfo: {} },
      additionList: [],
      projectList: []
    }
  },
  methods: {
    tableRowClassName({ row, rowIndex }) {
      if (rowIndex === 0) {
        return 'warning-row'
      }
      return ''
    },
    hasSkill(id) {
      return this.skills.hasOwnProperty(id)
    },
    skillChange(item, val) {
      if (val) {
        this.skills[item.id] = item.skillInfo
      } else {
        delete this.skills[item.id]
      }
    },
    selectSkill(item) {
      console.log(item)
      this.selectProject = item
    },
    async getProjectList() {
      await this.$IDB.executeTransaction(['project'], 'readonly', t => {
        const store = t.objectStore('project')
        const request = store.index('parentID').openCursor(IDBKeyRange.only(this.kind.id))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            const skillInfo = this.skills[cursor.value.id] || {}
            cursor.value.skillInfo = skillInfo
            this.projectList.push(cursor.value)
            cursor.continue()
          }
        }
      })
      if (this.projectList.length > 0) {
        this.selectProject = this.projectList[0]
      }
    }
  },
  computed: {
    skillList() {
      if (this.selectProject.name) {
        return [this.selectProject].concat(this.additionList)
      }
      return []
    }
  },
  watch: {
    skills(val) {
      for (let p of this.projectList) {
        const skillInfo = val[p.id] || {}
        p.skillInfo = skillInfo
      }
      if (this.projectList.length > 0) {
        this.selectProject = this.projectList[0]
        for (let a of this.additionList) {
          const skillInfo = val[a.id] || {}
          a.skillInfo = skillInfo
        }
      }
    },
    selectProject(val) {
      console.log(val)
      this.additionList = []
      this.$IDB.executeTransaction(['addition'], 'readonly', t => {
        const store = t.objectStore('addition')
        const request = store.index('parentID').openCursor(IDBKeyRange.only(val.id))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            const skillInfo = this.skills[cursor.value.id] || {}
            cursor.value.skillInfo = skillInfo
            this.additionList.push(cursor.value)
            cursor.continue()
          }
        }
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.skill-item-text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin: 0 4px;
}
.skill-item {
  position: relative;
  width: 110px;
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
.skill-item.get::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67c23a;
}
/* .skill-item.get {
  background-color: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
} */
.skill-item.select {
  background-color: #409eff;
  color: #fff;
}
.project {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-content: flex-start;
  flex: 0 0 250px;
  overflow-y: auto;
  border-right: 1px solid #dcdfe6;
}
.skill {
  display: flex;
  justify-content: center;
  overflow: hidden;
  flex: 1;
}
.tab-content {
  height: calc(90vh - 318px);
}
</style>
<style>
/* .el-table td,
.el-table th {
  padding: 3px 0;
} */
.el-table .warning-row {
  background: rgba(64, 158, 255, 0.1);
}
</style>
