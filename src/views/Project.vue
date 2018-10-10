<template lang="pug">
  .page
    KindPanel(v-for="item in kindList" :kind="item" :workingTableList="workingTableList" :key="item.id")
</template>
<script>
import KindPanel from '@/components/KindPanel'

export default {
  components: {
    KindPanel
  },
  data() {
    return {
      kindList: [],
      workingTableList: []
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      const kindList = []
      await this.$IDB.executeTransaction('kind', 'readonly', (t) => {
        const store = t.objectStore('kind')
        const request = store.openCursor()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            kindList.push(cursor.value)
            cursor.continue()
          }
        }
      })
      await this.$IDB.executeTransaction('workingTable', 'readonly', (t) => {
        const store = t.objectStore('workingTable')
        const request = store.getAll()
        request.onsuccess = (event) => {
          const result = event.target.result
          if (result) {
            this.workingTableList = result
          }
        }
      })
      this.kindList = kindList
    }
  }
}
</script>
<style scoped>
.page {
  display: block;
  padding: 5px;
  overflow-y: auto;
  background-color: #fafafa;
}
</style>
