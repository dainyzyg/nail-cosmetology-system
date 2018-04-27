<template lang="pug">
.page.col
  template(v-if="projectInfo")
    .feeInfos
      .project-info-item.focus
        .project-info-item-title Pedicure
        .project-info-item-line
          span technician
          span Tammy
        .project-info-item-line
          span fee
          span $12.3
        .project-info-item-line
          span total
          span $43.3
      .project-info-item(v-for="i in orderInfo")
        .project-info-item-title {{i.projectItem.project.englishName||i.projectItem.project.name}}
        .project-info-item-line
          span technician
          span {{i.technicianName}}
        .project-info-item-line
          span fee
          span $0
        .project-info-item-line
          span total
          span ${{getAmount(i.projectItem)}}
    .detail
      .info.border
        .title Project Info
        .content
          .info-line.project
            .info-title {{projectInfo.project.englishName||projectInfo.project.name}}
            .info-value ${{projectInfo.project.price}}
          .info-line(v-for="i in projectInfo.additions")
            .info-title {{i.englishName||i.name}}
            .info-value ${{i.price}}
          .info-line
            .info-title 小费
            .info-value ${{fee.toFixed(2)}}
          .info-line
            .info-title technician
            .info-value {{orderInfo[this.projectIndex].technicianName}}
          .info-line.total
            .info-title total
            .info-value ${{(projectAccount+fee).toFixed(2)}}
      .select-wrapper.border
        .title Choose Tips
        .content
          .option-item(v-for="i in feeInfo" @click="select(i.percentage)")
            .percentage {{i.percentage}}%
            .fee $ {{(projectAccount*i.percentage/100).toFixed(2)}}
            .des {{i.description}}
          .option-item Other Amount
  NumberPad(v-if="false")
  template(v-if="orderInfo.length==0")
    .content-page Customer Screen
  template(v-if="orderInfo.length==100")
    .content-page Thanks!
</template>

<script>
import NumberPad from './NumberPad.vue'

export default {
  components: {
    NumberPad
  },
  data() {
    return {
      feeInfo: [],
      orderInfo: [],
      projectIndex: 0,
      fee: 0
    }
  },
  async created() {
    this.getFeeInfo()
    window.ipcRenderer.on('receive-order-info', this.receiveOrderInfo)
  },
  methods: {
    getAmount(projectItem) {
      let price = projectItem.project.price || 0
      projectItem.additions.forEach(a => {
        let p = a.price || 0
        price += p
      })
      return price.toFixed(2)
    },
    select(percentage) {
      this.fee = this.projectAccount * percentage / 100
    },
    getFeeInfo() {
      const feeInfo = []
      const openRequest = indexedDB.open('MyDatabase')
      openRequest.onerror = event => {
        console.log(event, event.target.error.message)
      }
      openRequest.onsuccess = event => {
        this.db = event.target.result
        const t = this.db.transaction('feeInfo')
        const request = t.objectStore('feeInfo').openCursor()
        request.onsuccess = e => {
          const cursor = e.target.result
          if (cursor) {
            feeInfo.push(cursor.value)
            cursor.continue()
          }
        }
      }
      this.feeInfo = feeInfo
      console.log(this.feeInfo)
    },
    confirm() {
      window.ipcRenderer.send('send-fee', 998)
    },
    receiveOrderInfo(event, arg) {
      console.log('receiveOrderInfo')
      this.orderInfo = arg.preAssignItems
      console.log(arg.preAssignItems)
    }
  },
  computed: {
    projectAccount() {
      let price = this.projectInfo.project.price || 0
      this.projectInfo.additions.forEach(a => {
        let p = a.price || 0
        price += p
      })
      return price
    },
    projectInfo() {
      if (this.orderInfo[this.projectIndex] && this.orderInfo[this.projectIndex].projectItem) {
        return this.orderInfo[this.projectIndex].projectItem
      }
      return null
    }
  }
}
</script>

<style scoped>
.project-info-item-title {
  display: flex;
  justify-content: center;
  padding-bottom: 2px;
}
.project-info-item-line {
  display: flex;
  justify-content: space-between;
}
.project-info-item.focus {
  border: 1px solid slategray;
}
.project-info-item {
  padding: 2px 5px;
  flex: 0 0 160px;
  border: 1px solid #ebebeb;
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6), 0 2px 4px 0 rgba(232, 237, 250, 0.5);
  /* border: 1px solid slategray; */
  border-radius: 10px;
  margin-right: 10px;
  margin-bottom: 10px;
}
.feeInfos {
  display: flex;
  flex-wrap: wrap;
}
.detail {
  display: flex;
  flex: 1;
  align-items: stretch;
}
.content-page {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10vw;
  font-weight: bolder;
}
.page {
  color: slategray;
  box-sizing: border-box;
  background: #fff;
  padding: 10px;
}
.info {
  flex: 0 0 250px;
  margin-right: 10px;
}
.select-wrapper {
  flex: 1;
}
.border {
  border: 1px solid #ebebeb;
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6), 0 2px 4px 0 rgba(232, 237, 250, 0.5);
  border-radius: 8px;
}
.title {
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bolder;
  border-bottom: 1px solid #ebebeb;
}
.info-line {
  font-size: 17px;
  line-height: 30px;
  display: flex;
  justify-content: space-between;
}
.info-title {
}
.info-value {
}
.total {
  border-top: 1px dashed slategray;
}
.project {
  border-bottom: 1px dashed slategray;
}
.content {
  padding: 5px;
}
.option-item {
  color: white;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  height: 50px;
  border: 2px solid slategray;
  border-radius: 8px;
  margin: 25px;
  background: slategray;
}
.option-item:active {
  background: white;
  color: slategray;
}
.percentage {
  flex: 0 0 100px;
}
.fee {
  flex: 0 0 100px;
}
.des {
  flex: 1;
}
</style>
