<template lang="pug">
  .project
    ProjectLineTitle(@addAddition="addAddition" @removeAddition="removeAddition" @removeProject="removeProject")
    .workingTable
      | 工作台：
      el-select(placeholder="请选择" size="mini" style="width:130px" v-model="project.workingTableID" @change="save")
        el-option(v-for="item in workingTableList" :key="item.id" :label="item.type" :value="item.id")
    ProjectLine(:project="project")
    ProjectLine(v-for="addition,index in additionList" :key="addition.id" :addition="addition" @focus="select(addition,index)" @blur="unselect")
</template>

<script>
import ProjectLine from '@/components/ProjectLine'
import ProjectLineTitle from '@/components/ProjectLineTitle'

export default {
  components: {
    ProjectLine,
    ProjectLineTitle
  },
  props: ['project', 'workingTableList'],
  created() {
    this.getData()
  },
  data() {
    return {
      additionList: [],
      selectedAddition: null,
      selectedAdditionIndex: null
    }
  },
  methods: {
    removeProject() {
      this.$emit('remove')
      console.log('removeProject')
    },
    async addAddition() {
      const data = {
        id: this.$getNewID,
        name: '新建附加',
        parentID: this.project.id
      }
      await this.$IDB.add('addition', data)
      this.additionList.push(data)
      console.log('addAddition')
    },
    async removeAddition() {
      console.log('removeAddition')
      if (!this.selectedAddition) {
        return
      }
      await this.$IDB.delete('addition', this.selectedAddition.id)
      this.additionList.splice(this.selectedAdditionIndex, 1)
      this.selectedAddition = null
      this.selectedAdditionIndex = null
      console.log('removeAddition')
    },
    async getData() {
      const additionList = []
      await this.$IDB.executeTransaction('addition', 'readonly', (t) => {
        const store = t.objectStore('addition')
        const request = store.openCursor()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            if (this.project.id == cursor.value.parentID) {
              additionList.push(cursor.value)
            }
            cursor.continue()
          }
        }
      })
      additionList.sort((a, b) => {
        let indexA = a.index
        let indexB = b.index

        if (a.index == null) {
          indexA = a.id
        }
        if (b.index == null) {
          indexB = b.id
        }
        return indexA - indexB
      })
      this.additionList = additionList
    },
    select(addition, index) {
      console.log('select')
      this.selectedAddition = addition
      this.selectedAdditionIndex = index
    },
    unselect() {
      console.log('unselect')
      // this.selectedAddition = null
      // this.selectedAdditionIndex = null
    },
    save() {
      this.$IDB.put('project', this.project)
    }
  },
  computed: {},
  watch: {}
}
</script>

<style scoped>
.project {
  width: 260px;
  border: 1px solid #aaa;
  margin-bottom: 4px;
}
.workingTable {
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 12px;
  font-weight: bolder;
  height: 36px;
  border-bottom: 1px solid #dcdfe6;
}
</style>
