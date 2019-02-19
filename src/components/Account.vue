<template lang="pug">
  el-dialog.dialog(title='结算' :visible.sync='dialogVisible' width="96vw" top="2vh" style="overflow:hidden;")
    .dialog-body.flex
      CheckOutPanel(:total='total' :orderInfo='orderInfo' :focusType.sync="focusType" :couponAmount.sync="couponAmount" :creditCardAmount.sync='creditCardAmount' :giftCardAmount.sync='giftCardAmount' :cashAmount.sync='cashAmount')
    .dialog-footer(slot='footer')
      .checkout-info
        //- .total 总计：{{total}}
        .total
          span.iconfont.icon-jine
          | 应收合计：${{total}}
        .pay-type(@click="focusType='cashAmount'" :class='{focus:focusType=="cashAmount"}')
          span.iconfont.icon-xianjin
          | 现金:$ {{cashAmount}}
        .pay-type(@click="focusType='giftCardAmount'" :class='{focus:focusType=="giftCardAmount"}')
          span.iconfont.icon-lika
          | 礼卡:$ {{giftCardAmount}}
        .pay-type(@click="focusType='creditCardAmount'" :class='{focus:focusType=="creditCardAmount"}')
          span.iconfont.icon-xinyongka
          | 信用卡:$ {{creditCardAmount}}
        .pay-type(@click="focusType='couponAmount'" :class='{focus:focusType=="couponAmount"}')
          span.iconfont.icon-xinyongka
          | 优惠券:$ {{couponAmount}}
        .actual-receipts
          span.iconfont.icon-recieve
          | 实收金额:$ {{payTotal}}
      .btns
        el-button(@click="cancel") 取 消
        //- el-button(type='success' @click="openScreen") 小费屏幕
        el-button(type='primary' @click="comfirm") 结 账
</template>

<script>
import CheckOutPanel from '@/components/CheckOutPanel'

export default {
  components: {
    CheckOutPanel
  },
  props: {
    data: {
      default: []
    },
    visible: {
      default: false
    },
    flex: {
      default: '1'
    }
  },
  created() {
    // window.ipcRenderer.on('receive-fee', this.receiveFee)
    this.getRateConfig()
  },
  beforeDestroy() {
    // clearInterval(this.setIntervalIndex)
    // window.ipcRenderer.removeListener('receive-fee', this.receiveFee)
  },
  data() {
    return {
      focusType: '',
      couponAmount: 0,
      creditCardAmount: 0,
      giftCardAmount: 0,
      cashAmount: 0,
      orderInfo: [],
      dialogVisible: false,
      tipList: [],
      rateConfig: []
    }
  },
  methods: {
    async getRateConfig() {
      this.rateConfig = await this.$IDB.getAll('rateConfig')
    },
    openScreen() {
      window.ipcRenderer.send('notice-fee-screen', { checkoutProjectList: this.data })
    },
    receiveFee(event, tipList) {
      this.tipList = tipList
    },
    async comfirm() {
      try {
        // 校验数据
        if (this.payTotal != this.total) {
          this.$message({
            showClose: true,
            message: '实收金额与应收合计不符！',
            type: 'error'
          })
          return
        }
        for (let projectItem of this.orderInfo) {
          if (projectItem.rate <= 0) {
            this.$message({
              showClose: true,
              dangerouslyUseHTMLString: true,
              message: `未完成技师评分！<br><br> 顾客:${projectItem.name}, 项目:${projectItem.project.name}, 技师:${projectItem.technicianName}`,
              type: 'error'
            })
            return
          }
          // // 小费有可能是0
          // if (projectItem.tip <= 0) {
          //   this.$message({
          //     showClose: true,
          //     dangerouslyUseHTMLString: true,
          //     message: `未添加小费！<br><br> 顾客:${projectItem.name}, 项目:${projectItem.project.name}, 技师:${projectItem.technicianName}`,
          //     type: 'error'
          //   })
          //   return
          // }
        }
        // 完成校验
        // 保存到data.orderObj
        this.orderInfo.forEach(e => {
          // tip,checkout
          const orderInfoItem = this.$algorithm.data.orderObj[e.id].orderInfo.find(x => x.assignItemID == e.assignItemID)
          // 计算价格
          // let price = orderInfoItem.project.price || 0
          // orderInfoItem.additions.forEach((a) => {
          //   let p = a.price || 0
          //   price += p
          // })
          // price = this.$fixNum(price)

          // 计算保底消费
          let rateItem = this.rateConfig.find(x => x.rate == e.rate)
          let bottomTipProportion = 0
          if (rateItem && rateItem.bottomTipProportion) {
            bottomTipProportion = rateItem.bottomTipProportion || 0
          }
          e.bottomTip = Math.round(e.accountAndCommission.accountTotal * bottomTipProportion / 100)
          // 计算小费补贴
          if (e.bottomTip > e.tip) {
            e.subsidy = e.bottomTip - e.tip
          } else {
            e.subsidy = 0
          }

          let checkoutInfo = {
            bottomTip: e.bottomTip,
            subsidy: e.subsidy,
            tip: e.tip,
            rate: e.rate,
            projectAccount: e.accountAndCommission.accountTotal,
            totalAccount: this.$fixNum(e.accountAndCommission.accountTotal + e.tip)
          }
          this.$set(orderInfoItem, 'checkoutInfo', checkoutInfo)
        })
        // 保存结账数据
        let checkout = {
          id: this.$getNewID, // key
          orderInfo: this.orderInfo,
          createTime: this.$algorithm.getDateNow(),
          date: this.$algorithm.getDateStart(), // index
          creditCardAmount: this.$fixNum(this.creditCardAmount),
          giftCardAmount: this.$fixNum(this.giftCardAmount),
          cashAmount: this.$fixNum(this.cashAmount),
          couponAmount: this.couponAmount,
          payTotal: this.payTotal,
          total: this.total,
          commissionAccountTotal: this.commissionAccountTotal,
          tips: this.tips,
          projectPrices: this.projectPrices
        }
        await this.$IDB.put('checkoutList', checkout)

        this.$emit('update:visible', false)
        this.$algorithm.saveScheduleData()
      } catch (e) {
        this.$alert(e.message, '错误提示', {
          confirmButtonText: '确定',
          type: 'error'
        })
      }
    },
    async setorderTip(orderID, tipObj) {
      await this.$IDB.executeTransaction(['order'], 'readwrite', (t) => {
        const store = t.objectStore('order')
        const request = store.get(orderID)
        request.onsuccess = (event) => {
          const order = event.target.result
          order.tipObj = order.tipObj || {}
          for (let i in tipObj) {
            order.tipObj[i] = tipObj[i]
          }
          store.put(order)
        }
      })
    },
    cancel() {
      this.$emit('update:visible', false)
    }
  },
  computed: {
    payTotal() {
      return this.cashAmount + this.giftCardAmount + this.creditCardAmount + this.couponAmount
    },
    commissionAccountTotal() {
      let total = 0
      this.orderInfo.forEach((item) => {
        let price = item.accountAndCommission.commissionAccountTotal || 0
        total += price
      })
      return total
    },
    total() {
      // debugger
      let total = 0
      this.orderInfo.forEach((item) => {
        let price = item.accountAndCommission.accountTotal || 0
        price += item.tip || 0
        total += price
      })
      return total
    },
    tips() {
      let total = 0
      this.orderInfo.forEach((item) => {
        total += item.tip || 0
      })
      return total
    },
    projectPrices() {
      return this.total - this.tips
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      this.tipList = []
      if (val) {
        this.orderInfo = this.$clone(this.data)
        this.creditCardAmount = 0
        this.giftCardAmount = 0
        this.cashAmount = 0
        this.couponAmount = 0
        this.focusType = ''
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.total {
  padding: 0 10px;
  margin-right: 20px;
  border-radius: 5px;
  color: #67c23a;
  background: #f0f9eb;
  border-color: #b3d8ff;
  /* border-style: solid;
  border-width: 1px; */
  display: flex;
  align-items: center;
}
.actual-receipts {
  margin-left: 10px;
  padding: 0 10px;
  border-radius: 5px;
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
  border-style: solid;
  border-width: 1px;
  display: flex;
  align-items: center;
}
.pay-type {
  cursor: pointer;
  margin-left: 10px;
  padding: 0 10px;
  border-radius: 5px;
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
  /* border-style: solid;
  border-width: 1px; */
  display: flex;
  align-items: center;
}
.pay-type.focus {
  color: #ecf5ff;
  background: #409eff;
}
.checkout-info {
  display: flex;
  align-items: stretch;
}
.dialog >>> .el-dialog__body {
  padding: 0px 8px;
}
.dialog >>> .el-dialog__footer,
.dialog >>> .el-dialog__header {
  padding: 8px 20px;
}
.dialog >>> .el-dialog__headerbtn {
  top: 9px;
}
.dialog-body {
  height: calc(96vh - 56px - 40px);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>
