<template lang="pug">
.page.col
  .feeInfos
    .project-info-item(v-for="i,index in orderInfo" :class="{focus:isfocus(index)}" @click="projectIndex=index")
      .project-info-item-title.border-bottom {{i.name}}
      .project-info-item-title {{i.project.englishName||i.project.name}}
      .project-info-item-line
        span tech
        span {{i.technicianName}}
      .project-info-item-line
        span tip
        span ${{i.tip||0}}
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
          .info-value ${{(projectInfo.tip||0)}}
        .info-line
          .info-title technician
          .info-value {{projectInfo.technicianName}}
        .info-line.total
          .info-title total
          .info-value ${{(projectAccount+projectFee)}}
    .select-wrapper.border
      .title Choose Tips
      .select-content
        .option-item(v-for="i in feeInfo" @click="select(i.percentage)")
          .percentage {{i.percentage}}%
          .fee $ {{Math.round(projectAccount*i.percentage/100)}}
          .des {{i.description}}
        .option-item-other(@click="focusOtherAmount" :class='{focusOtherAmount:focusType=="otherAmount"}')
          .des Enter tip amount: ${{projectInfo.tip||0}}
      .tech-rate
        .tech-title 技师评分({{projectInfo.technicianName}})：
        el-rate(v-model='projectInfo.rate')
    .btn-zoom
      .number-pad-show {{numberPadString}}
      .btn-line
        .btn-func-green(@click="allAccount('couponAmount')")
          | 全部
          br
          | 优惠券
        .btn-func-green(@click="allAccount('giftCardAmount')")
          | 全部
          br
          | 礼卡
        .btn-func-green(@click="allAccount('creditCardAmount')")
          | 全部
          br
          | 信用卡
      .btn-line
        .btn-func(@click="remaingAccount('couponAmount')")
          | 剩余
          br
          | 优惠券
        .btn-func(@click="remaingAccount('giftCardAmount')")
          | 剩余
          br
          | 礼卡
        .btn-func(@click="remaingAccount('creditCardAmount')")
          | 剩余
          br
          | 信用卡
      .btn-line
        .btn-func-green(@click="allAccount('cashAmount')" style="width:126px;")
          | 全部
          br
          | 现金
        .btn-func(@click="remaingAccount('cashAmount')")
          | 剩余
          br
          | 现金
        //- .btn-func(style="visibility:hidden;")
      .btn-line(v-for='i in 3')
        .btn(v-for='j in 3' @click="inputNumber((i-1)*3+j)") {{(i-1)*3+j}}
      .btn-line
        //- .btn(@click="inputNumber('.')" style="visibility:hidden;") .
        .btn(@click="inputNumber(0)" style="width:126px;") 0
        .btn(@click="numberPadString='0'")
          span.iconfont.icon-tuige(style='font-size:26px;')
</template>

<script>
export default {
  components: {},
  props: {
    total: {
      default: 0
    },
    orderInfo: {
      default: []
    },
    couponAmount: {
      default: 0
    },
    creditCardAmount: {
      default: 0
    },
    giftCardAmount: {
      default: 0
    },
    cashAmount: {
      default: 0
    },
    focusType: {
      default: ''
    }
  },
  data() {
    return {
      numberPadString: '0',
      otherAmount: '',
      feeInfo: [],
      projectIndex: 0,
      fee: 0
    }
  },
  async created() {
    window.addEventListener('keydown', this.keyup)
    this.getFeeInfo()
    // window.ipcRenderer.on('receive-order-info', this.receiveOrderInfo)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.keyup)
  },
  methods: {
    keyup(e) {
      if (e.key.match(/^[0-9]$/)) {
        this.inputNumber(Number(e.key))
      } else if (e.key == 'Backspace' || e.key == 'Delete') {
        this.numberPadString = '0'
      }
      // Backspace Delete
      console.log(e.key)
    },
    refreshNumberPadString() {
      let val = this.focusType
      if (val) {
        if (val == 'otherAmount') {
          this.numberPadString = this.projectInfo.tip.toString()
        } else {
          this.numberPadString = this[val].toString()
        }
      }
    },
    allAccount(typeName) {
      let typeList = ['cashAmount', 'giftCardAmount', 'creditCardAmount', 'couponAmount']
      typeList.forEach(e => {
        if (typeName == e) {
          console.log('==', e)
          this.$emit(`update:${e}`, this.total)
        } else {
          console.log('!=', e)
          this.$emit(`update:${e}`, 0)
        }
      })
      this.$nextTick(() => this.refreshNumberPadString())
    },
    remaingAccount(typeName) {
      let typeList = ['cashAmount', 'giftCardAmount', 'creditCardAmount', 'couponAmount']
      let selectedAccount = 0
      typeList.forEach(e => {
        if (typeName != e) {
          selectedAccount += this[e]
        }
      })
      if (this.total - selectedAccount > 0) {
        this.$emit(`update:${typeName}`, this.total - selectedAccount)
      }
      this.$nextTick(() => this.refreshNumberPadString())
    },
    inputNumber(i) {
      if (i == '.') {
        if (this.numberPadString.search(/\./) < 0) {
          this.numberPadString = `${this.numberPadString}${i}`
        }
      } else if (this.numberPadString == '0') {
        this.numberPadString = `${i}`
      } else {
        let decimalPart = this.numberPadString.split('.')[1]
        if (decimalPart && decimalPart.length >= 2) {
          return
        }
        this.numberPadString = `${this.numberPadString}${i}`
      }
    },
    focusOtherAmount() {
      this.$emit('update:focusType', 'otherAmount')
      // this.numberPadString = this.projectInfo.tip.toString()
    },
    numberChange(number) {
      // this.$set(this.projectInfo, 'tip', number)
      this.projectInfo.tip = number
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
      return price
    },
    select(percentage) {
      // this.fee = this.projectAccount * percentage / 100
      // this.$set(this.projectInfo, 'tip', this.projectAccount * percentage / 100)
      this.projectInfo.tip = Math.round(this.projectAccount * percentage / 100)
      if (this.focusType == 'otherAmount') {
        this.$emit('update:focusType', '')
      }
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
  watch: {
    focusType(val) {
      if (val) {
        console.log('focusType')
        if (val == 'otherAmount') {
          this.numberPadString = this.projectInfo.tip.toString()
        } else {
          this.numberPadString = this[val].toString()
        }
      }
    },
    numberPadString(val) {
      // 更新选中的值
      if (this.focusType) {
        console.log('numberPadString')
        if (this.focusType == 'otherAmount') {
          this.projectInfo.tip = Number(val)
        } else {
          this.$emit(`update:${this.focusType}`, Number(val))
        }
      }
    },
    projectIndex() {
      if (this.focusType == 'otherAmount') {
        this.$emit('update:focusType', '')
      }
    },
    orderInfo(val) {
      console.log('orderInfo')
      this.projectIndex = 0
      this.numberPadString = '0'
    }
  },
  computed: {
    // orderInfo() {
    //   return this.data
    // },
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
.select-content {
  padding: 5px;
  flex: 1;
  overflow-y: auto;
}
.tech-rate {
  padding-left: 30px;
  flex: 0 0 50px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  /* background: #409eff; */
}
.tech-title {
  font-size: 22px;
  color: #74787d;
}
.tech-rate >>> .el-rate {
  height: 50px;
}
.tech-rate >>> .el-rate__icon {
  font-size: 40px;
}
.btn-zoom {
  overflow-y: auto;
  padding: 0 3px;
  flex: 0 0 198px;
  /* display: flex; */
  /* flex-direction: column; */
  /* justify-content: flex-end; */
}
.btn-line {
  display: flex;
  height: 66px;
  /* background: skyblue; */
  justify-content: space-around;
  align-items: center;
}
.btn-func {
  cursor: pointer;
  width: 60px;
  height: 60px;
  border-radius: 5px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}
.btn-func:active {
  background: #409eff;
  color: #ecf5ff;
}
.btn-func-green {
  cursor: pointer;
  width: 60px;
  height: 60px;
  border-radius: 5px;
  background: #f0f9eb;
  color: #67c23a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}
.btn-func-green:active {
  background: #67c23a;
  color: #f0f9eb;
}
.number-pad-show {
  font-weight: bold;
  padding-right: 10px;
  font-size: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 30px;
  margin-left: 3px;
  margin-right: 3px;
  border-radius: 5px;
  background: #f2f6fc;
}
.btn {
  cursor: pointer;
  width: 60px;
  height: 60px;
  border-radius: 5px;
  background: #e4e4e4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
}
.btn:active {
  background: gray;
  color: white;
}
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
  border: 2px solid #409eff;
}
.project-info-item {
  padding: 2px 5px;
  flex: 0 0 160px;
  border: 1px solid #ebebeb;
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6),
    0 2px 4px 0 rgba(232, 237, 250, 0.5);
  border: 2px solid #ebeef5;
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
  color: #606266;
  box-sizing: border-box;
  background: #fff;
}
.info {
  flex: 0 0 250px;
  margin-right: 10px;
}
.select-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6),
    0 2px 4px 0 rgba(232, 237, 250, 0.5);
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
  font-size: 14px;
  line-height: 30px;
  display: flex;
  justify-content: space-between;
}
.total {
  border-top: 1px dashed #606266;
}
.border-bottom {
  border-bottom: 1px dashed #606266;
}
.project {
  border-bottom: 1px dashed #606266;
}
.content {
  padding: 5px;
}
.option-item,
.option-item-other {
  color: white;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  height: 44px;
  border: 1px solid #409eff;
  border-radius: 8px;
  margin: 25px;
  background: #ecf5ff;
  color: #409eff;
}
.option-item-other.focusOtherAmount {
  background: #409eff;
  color: white;
}
.option-item:active {
  background: #409eff;
  color: white;
}
.percentage {
  flex: 0 0 60px;
}
.fee {
  flex: 0 0 100px;
}
.des {
  flex: 1;
}
</style>
