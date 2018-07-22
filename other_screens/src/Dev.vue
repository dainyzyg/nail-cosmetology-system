<template lang="pug">
  .page.col
    .breadcrumb-wraper
      |排 钟 屏 幕 dev
      .btn(@click="refresh") 刷新
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
    window.ipcRenderer.on('receive-dev', (e, arg) => {
      console.log(arg)
      this.assignObject.preAssignList = JSON.parse(arg, (k, v) => {
        if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
          return new Date(v)
        }
        return v
      })
    })
    this.getData()
  },
  beforeDestroy() {
    window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },
  methods: {
    refresh() {
      console.log('refresh')

      const t = this.db.transaction('devData')
      t.onerror = (e) => {
        console.log('t error')
        console.log(e)
      }
      t.onabort = (e) => {
        console.log('t abort')
        console.log(e)
      }
      t.oncomplete = (e) => {
        console.log('t oncomplete')
        console.log(e)
      }
      const request = t.objectStore('devData').get('preAssignList')
      request.onsuccess = (e) => {
        console.log(e.target.result)
      }
      request.onerror = (e) => {
        console.log(e)
      }
    },
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
.btn {
  border: 1px solid purple;
  margin: 5px;
  padding: 0 10px;
  cursor: pointer;
}
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
