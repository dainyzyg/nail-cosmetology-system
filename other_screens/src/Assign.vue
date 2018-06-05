<template lang="pug">
  .page.col
    .breadcrumb-wraper 排 钟 屏 幕
      //- el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
    ClockTable(:assignObject="assignObject")
</template>
<script>
import ClockTable from '../../src/components/ClockTable.vue'

export default {
  components: {
    ClockTable
  },
  data() {
    return {
      db: null,
      assignObject: {
        technicianList: [],
        preAssignList: [],
        historyPreAssignList: [],
        dateNow: new Date()
      }
    }
  },
  async created() {
    window.ipcRenderer.on('asynchronous-reply', this.getData)
    this.getData()
  },
  beforeDestroy() {
    window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },
  methods: {
    async getData() {
      if (!this.db) {
        const openRequest = indexedDB.open('MyDatabase')
        openRequest.onerror = (event) => {
          console.log(event, event.target.error.message)
        }
        openRequest.onsuccess = (event) => {
          this.db = event.target.result
          const t = this.db.transaction('assignList')
          const request = t.objectStore('assignList').get(new Date('2018/2/26'))
          request.onsuccess = (e) => {
            this.assignObject = e.target.result
          }
        }
      } else {
        const t = this.db.transaction('assignList')
        const request = t.objectStore('assignList').get(new Date('2018/2/26'))
        request.onsuccess = (e) => {
          this.assignObject = e.target.result
        }
      }
    }
  },
  computed: {},
  watch: {}
}
</script>
<style scoped>
.breadcrumb-wraper {
  color: #444;
  font-size: 22px;
  font-weight: bold;
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eaeefb;
}
.table-wraper {
  color: #606266;
  position: relative;
  flex: 1;
  margin-left: 8px;
  padding-right: 3px;
  overflow: hidden;
  overflow-y: auto;
}
</style>
