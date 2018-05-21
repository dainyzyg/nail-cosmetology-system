<template lang="pug">
  .kind
    .kind-title
      |{{kind.name}}
      el-select.margin(placeholder="排钟规则" size="mini" v-model="kind.orderRule" @change="saveKind")
        el-option(v-for="item in orderRuleList" :key="item" :label="item" :value="item")
      el-select.margin(placeholder="预先级" size="mini" v-model="kind.priority" @change="saveKind")
        el-option(v-for="item in priorityList" :key="item" :label="item" :value="item")
      span.margin 工作台数限制
      el-switch.margin(v-model="kind.workingTableLimit" size="mini"  @change="saveKind")
      el-input-number.margin(v-if="kind.workingTableLimit" size="mini" v-model="kind.workingTableLimitNumber"  @change="saveKind")
      el-button.margin(size="mini" type="primary" @click="addProject") 添加项目
    .project-wrapper
      ProjectPanel(v-for="item,index in projectList" :key="item.id" @remove="removeProject(index,item)" :project="item")
      .project-empty(v-for="i in 10")
</template>

<script>
import ProjectPanel from '@/components/ProjectPanel'

export default {
  components: {
    ProjectPanel
  },
  props: ['kind'],
  created() {
    this.getData()
  },
  data() {
    return {
      orderRuleList: ['由前到后', '由后到前'],
      priorityList: [1, 2, 3, 4, 5, 6],
      projectList: []
    }
  },
  methods: {
    async removeProject(index, project) {
      await this.$IDB.executeTransaction('addition', 'readwrite', t => {
        const store = t.objectStore('addition')
        const request = store.index('parentID').openCursor(IDBKeyRange.only(project.id))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            store.delete(cursor.value.id)
            cursor.continue()
          }
        }
      })
      await this.$IDB.delete('project', project.id)
      this.projectList.splice(index, 1)
    },
    async addProject() {
      const data = {
        id: this.$getNewID,
        name: '新建项目',
        parentID: this.kind.id
      }
      await this.$IDB.add('project', data)
      this.projectList.push(data)
    },
    saveKind() {
      this.$IDB.put('kind', this.kind)
    },
    async getData() {
      const projectList = []
      await this.$IDB.executeTransaction('project', 'readonly', t => {
        const store = t.objectStore('project')
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            if (this.kind.id == cursor.value.parentID) {
              projectList.push(cursor.value)
            }
            cursor.continue()
          }
        }
      })
      this.projectList = projectList
    }
  },
  computed: {},
  watch: {}
}
</script>

<style scoped>
.project-empty {
  width: 197px;
  height: 0;
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
.margin {
  margin-left: 10px;
}
</style>
