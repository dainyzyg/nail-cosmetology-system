<template lang="pug">
  .page
    KindPanel(v-for="item in kindList" :kind="item" :key="item.id")
</template>
<script>
import KindPanel from '@/components/KindPanel'

export default {
  components: {
    KindPanel
  },
  data() {
    return {
      kindList: []
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      const kindList = []
      await this.$IDB.executeTransaction('kind', 'readonly', t => {
        const store = t.objectStore('kind')
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            kindList.push(cursor.value)
            cursor.continue()
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
