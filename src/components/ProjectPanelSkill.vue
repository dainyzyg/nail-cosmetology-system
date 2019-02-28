<template lang="pug">
  .project
    ProjectLineTitle(:kind="kind")
    ProjectLine(:project="project" :technician="technician")
    ProjectLine(v-for="addition,index in additionList" :key="addition.id" :addition="addition" :technician="technician")
</template>

<script>
import ProjectLine from '@/components/ProjectLineSkill'
import ProjectLineTitle from '@/components/ProjectLineTitleSkill'

export default {
  components: {
    ProjectLine,
    ProjectLineTitle
  },
  props: ['project', 'kind', 'technician'],
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
    async getData() {
      const additionList = []
      await this.$IDB.executeTransaction('addition', 'readonly', t => {
        const store = t.objectStore('addition')
        const request = store.openCursor()
        request.onsuccess = event => {
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
    }
  },
  computed: {},
  watch: {}
}
</script>

<style scoped>
.project {
  width: 215px;
  border: 1px solid #aaa;
  margin-bottom: 4px;
}
</style>
