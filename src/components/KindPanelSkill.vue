<template lang="pug">
  .kind
    .project-wrapper
      ProjectPanel(:technician="technician" :kind="kind" v-for="item,index in projectList" :key="item.id" @remove="removeProject(index,item)" :project="item")
      .project-empty(v-for="i in 10")
</template>

<script>
import ProjectPanel from '@/components/ProjectPanelSkill'

export default {
  components: {
    ProjectPanel
  },
  props: ['kind', 'technician'],
  created() {
    this.getData()
  },
  data() {
    return {
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
  width: 189px;
  height: 0;
}
.kind {
  border-radius: 4px;
  /* box-shadow: 0 2px 7px rgba(0, 0, 0, 0.15); */
  border: 1px solid #ebebeb;
  margin-bottom: 5px;
  margin-left: 5px;
  margin-right: 5px;
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
