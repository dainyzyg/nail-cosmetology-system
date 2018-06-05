<template lang="pug">
.page.col
  template(v-if="orderInfo.length>0")
    .feeInfos
      .project-info-item(v-for="i,index in orderInfo" :class="{focus:isfocus(index)}" @click="projectIndex=index")
        .project-info-item-title.border-bottom {{i.userName}}
        .project-info-item-title {{i.project.englishName||i.project.name}}
        .project-info-item-line
          span technician
          span {{i.technicianName}}
        .project-info-item-line
          span tip
          span ${{(i.tip||0).toFixed(2)}}
        .project-info-item-line
          span total
          span ${{getAmount(i)}}
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
            .info-title tip
            .info-value ${{(projectInfo.tip||0).toFixed(2)}}
          .info-line
            .info-title technician
            .info-value {{projectInfo.technicianName}}
          .info-line.total
            .info-title total
            .info-value ${{(projectAccount+projectFee).toFixed(2)}}
      .select-wrapper.border
        .title Choose Tips
        .content
          .option-item(v-for="i in feeInfo" @click="select(i.percentage)")
            .percentage {{i.percentage}}%
            .fee $ {{(projectAccount*i.percentage/100).toFixed(2)}}
            .des {{i.description}}
          .option-item(@click="numberPadShow=true") Other Amount
      .total-wrapper
        .total-account
          .total-account-line total account
          .total-account-line ${{totalAccount}}
        .submit-btn(@click="confirm") submit
  transition(name="slide-left")
    NumberPad(v-if="numberPadShow" :show.sync="numberPadShow" @numberChange="numberChange")
  template(v-if="orderInfo.length==0")
    .content-page Customer Screen
  template(v-if="false")
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
      fee: 0,
      numberPadShow: false
    }
  },
  async created() {
    this.getFeeInfo()
    window.ipcRenderer.on('receive-order-info', this.receiveOrderInfo)
  },
  methods: {
    numberChange(number) {
      this.$set(this.projectInfo, 'tip', number)
    },
    isfocus(index) {
      return index == this.projectIndex
    },
    getAmount(i) {
      let price = i.project.price || 0
      i.additions.forEach((a) => {
        let p = a.price || 0
        price += p
      })
      price += i.tip || 0
      return price.toFixed(2)
    },
    select(percentage) {
      // this.fee = this.projectAccount * percentage / 100
      this.$set(this.projectInfo, 'tip', this.projectAccount * percentage / 100)
      // this.next()
    },
    next() {
      if (this.projectIndex == this.orderInfo.length - 1) {
        // this.projectIndex = 0
      } else {
        this.projectIndex += 1
      }
    },
    getFeeInfo() {
      const feeInfo = []
      const openRequest = indexedDB.open('MyDatabase')
      openRequest.onerror = (event) => {
        console.log(event, event.target.error.message)
      }
      openRequest.onsuccess = (event) => {
        this.db = event.target.result
        const t = this.db.transaction('feeInfo')
        const request = t.objectStore('feeInfo').openCursor()
        request.onsuccess = (e) => {
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
      const tipList = this.orderInfo.map((i) => {
        return {
          id: i.id,
          tabID: i.tabID,
          orderID: i.orderID,
          projectID: i.project.id,
          technicianID: i.technicianID,
          technicianName: i.technicianName,
          tip: i.tip
        }
      })
      window.ipcRenderer.send('send-fee', tipList)
    },
    receiveOrderInfo(event, arg) {
      console.log(arg.checkoutProjectList)
      this.orderInfo = arg.checkoutProjectList
      this.projectIndex = 0
      console.log(arg.checkoutProjectList)
    }
  },
  computed: {
    totalAccount() {
      let total = 0
      this.orderInfo.forEach((item) => {
        let price = item.project.price || 0
        item.additions.forEach((a) => {
          let p = a.price || 0
          price += p
        })
        price += item.tip || 0
        total += price
      })
      return total.toFixed(2)
    },
    projectAccount() {
      let price = this.projectInfo.project.price || 0
      this.projectInfo.additions.forEach((a) => {
        let p = a.price || 0
        price += p
      })
      return price
    },
    projectFee() {
      return this.projectInfo.tip || 0
    },
    projectInfo() {
      return this.orderInfo[this.projectIndex] || null
    }
  }
}
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s ease-in-out;
}
.slide-left-enter,
.slide-left-leave-to {
  transform: translate3d(100%, 0, 0);
}
.slide-right-enter,
.slide-right-leave-to {
  transform: translate3d(-100%, 0, 0);
}
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
  border: 2px solid slategray;
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
.total-wrapper {
  flex: 0 0 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-left: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
}
.total-account {
  color: #606266;
  font-size: 17px;
  flex: 0 0 100px;
  border: 2px dashed #606266;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.total-account-line {
  line-height: 30px;
}
.submit-btn {
  color: white;
  font-weight: bolder;
  flex: 0 0 50px;
  background: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  border: 2px solid #606266;
}
.submit-btn:active {
  color: #606266;
  background: white;
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
.border-bottom {
  border-bottom: 1px dashed slategray;
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
