<template lang="pug">
  .page.col
    .breadcrumb-wraper
      el-radio-group(v-model='rType' size="medium")
        //- el-radio-button(label="custom") 顾客列表
        //- el-radio-button(label="tech") 技师列表
        el-radio-button(label="businessReport") 营业报表
        el-radio-button(label="techReport") 技师报单
      .count
        .count-item 现金:${{cashAmount}}
        .count-item 礼卡:${{giftCardAmount}}
        .count-item 信用卡:${{creditCardAmount}}
        .count-item 优惠券:${{couponAmount}}
        .count-item 合计:${{paytotals}}
      //- el-button(@click="print" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      template(v-if="rType=='custom'")
        el-table.table(:data="orderList" border height="calc(100vh - 66px)" key="custom")
          el-table-column(prop="name" label="顾客姓名")
          el-table-column(prop="phone" label="电话")
          el-table-column(prop="projects" label="项目")
          el-table-column(prop="tips" label="小费$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.tips.toFixed(2)}}
          el-table-column(prop="projectPrice" label="项目费用$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.projectPrice.toFixed(2)}}
          el-table-column(prop="payTotal" label="应收合计$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.payTotal.toFixed(2)}}
          //- 顾客 项目，小项，金额，技师 小费， 按技师汇总
      template(v-if="rType=='tech'")
        el-table.table(:data="techList" border height="calc(100vh - 66px)" key="tech")
          el-table-column(prop="name" label="技师姓名")
          el-table-column(label="项目数量")
            template(slot-scope="scope")
              .blue-font {{scope.row.projectList.length}}
          el-table-column(prop="tips" label="小费$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.tips.toFixed(2)}}
          el-table-column(prop="projectPrices" label="项目费用$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.projectPrices.toFixed(2)}}
          el-table-column(prop="payTotals" label="应收合计$" align="right")
            template(slot-scope="scope")
              .blue-font {{scope.row.payTotals.toFixed(2)}}
      //- template(v-if="rType=='report'")
      .print-wrapper(v-show="rType.includes('Report')")
        webview.webview(nodeintegration src="static/print.html" ref="printWebview" @ipc-message="webviewMessage")
        .print-func-panel
          el-button(@click="print" icon="el-icon-printer" size="medium" type="primary") 打印
          //- webview(disablewebsecurity nodeintegration src="static/print.html" ref="print" frameborder=0 style="border-radius:5px;border:1px solid rgb(235, 238, 245);padding:0;margin:0; width:80%;height:calc(100vh - 70px);")
</template>
<script>
export default {
  // components: {
  //   // ProjectSelect,
  //   SkillSetting
  // },
  data() {
    return {
      dateBegin: this.$algorithm.getDateStart(),
      dataEnd: this.$algorithm.getDateStart(),
      rType: 'businessReport',
      techList: [],
      orderList: [],
      paytotals: 0,
      cashAmount: 0,
      couponAmount: 0,
      creditCardAmount: 0,
      giftCardAmount: 0,
      commissionAccountTotal: 0,
      projectPrices: 0,
      tips: 0,
      firstSendObj: {
        domReady: false,
        getData: false
      }
    }
  },
  async created() {
    await this.getData()
    this.setFirstSendObj('getData')
  },
  methods: {
    webviewMessage(event) {
      // debugger
      // console.log('domReady', arguments)
      switch (event.channel) {
        case 'dom-ready':
          this.setFirstSendObj('domReady')
          // this.$refs.printWebview.openDevTools()
          break
      }
    },
    print() {
      // this.$refs.printWebview.send('data-change', this.orderList, this.techList)
      let printIframe = this.$refs.printWebview
      printIframe.send('print')
      // debugger
      // console.dir(this.$refs.print)
    },
    getProjectInfoTotal(item) {
      let price = item.project.price || 0
      item.additions.forEach((a) => {
        let p = a.price || 0
        price += p
      })
      return this.$fixNum(price)
    },
    async getData() {
      let query = IDBKeyRange.bound(this.dateBegin, this.dataEnd)
      let data = await this.$IDB.getAllByIndex('checkoutList', 'date', query)
      let orderMap = new Map()
      let techMap = new Map()
      console.time('a')
      data.forEach(item => {
        this.cashAmount += item.cashAmount
        this.creditCardAmount += item.creditCardAmount
        this.giftCardAmount += item.giftCardAmount
        this.couponAmount += item.couponAmount
        this.paytotals += item.payTotal
        this.commissionAccountTotal += item.commissionAccountTotal
        this.tips += item.tips
        this.projectPrices += item.projectPrices
        // console.log(item.payTotal)
        // this.tips +=item.tips
        // this.projectPrices +=item.projectPrices
        item.orderInfo.forEach(projectInfo => {
          // 生成顾客信息
          if (orderMap.has(projectInfo.id)) {
            let orderItem = orderMap.get(projectInfo.id)
            console.log(orderItem)
            orderItem.orderInfo.push({
              kind: projectInfo.kind,
              project: projectInfo.project,
              additions: projectInfo.additions,
              assignItemID: projectInfo.assignItemID,
              technicianID: projectInfo.technicianID,
              technicianName: projectInfo.technicianName,
              rate: projectInfo.rate,
              tip: projectInfo.tip
            })
            orderItem.projects += `,${projectInfo.project.name}`
            orderItem.tips = this.$fixNum(orderItem.tips + projectInfo.tip)
            let projectPrice = this.getProjectInfoTotal(projectInfo)
            orderItem.projectPrice = this.$fixNum(orderItem.projectPrice + projectPrice)
            orderItem.payTotal = this.$fixNum(orderItem.payTotal + projectInfo.tip + projectPrice)
          } else {
            let projectPrice = this.getProjectInfoTotal(projectInfo)
            orderMap.set(projectInfo.id, {
              id: projectInfo.id,
              name: projectInfo.name,
              phone: projectInfo.phone,
              projects: projectInfo.project.name,
              tips: projectInfo.tip,
              projectPrice,
              payTotal: this.$fixNum(projectInfo.tip + projectPrice),
              orderInfo: [{
                kind: projectInfo.kind,
                project: projectInfo.project,
                additions: projectInfo.additions,
                assignItemID: projectInfo.assignItemID,
                technicianID: projectInfo.technicianID,
                technicianName: projectInfo.technicianName,
                rate: projectInfo.rate,
                tip: projectInfo.tip
              }]
            })
          }
          // 生成技师信息
          // debugger
          // let projectPrice = this.getProjectInfoTotal(projectInfo)
          // let payTotal = this.$fixNum(projectPrice + projectInfo.tip)
          let projectObj = {
            accountAndCommission: projectInfo.accountAndCommission,
            kind: projectInfo.kind,
            project: projectInfo.project,
            additions: projectInfo.additions,
            assignItemID: projectInfo.assignItemID,
            rate: projectInfo.rate,
            tip: projectInfo.tip,
            orderId: projectInfo.id,
            orderName: projectInfo.name,
            orderPhone: projectInfo.phone,
            projectPrice: projectInfo.accountAndCommission.accountTotal,
            payTotal: projectInfo.accountAndCommission.accountTotal + projectInfo.tip,
            checkoutID: item.id,
            createTime: item.createTime,
            date: item.date
          }
          if (techMap.has(projectInfo.technicianID)) {
            let techItem = techMap.get(projectInfo.technicianID)
            techItem.projectList.push(projectObj)
            techItem.tips = techItem.tips + projectObj.tip
            techItem.projectPrices = techItem.projectPrices + projectObj.projectPrice
            techItem.payTotals = techItem.payTotals + projectObj.payTotal
            techItem.rates += projectObj.rate
            techItem.count += 1
            techItem.commissionTotal += projectObj.accountAndCommission.commissionAccountTotal
          } else {
            techMap.set(projectInfo.technicianID, {
              id: projectInfo.technicianID,
              name: projectInfo.technicianName,
              tips: projectObj.tip,
              rates: projectObj.rate,
              projectPrices: projectObj.projectPrice,
              payTotals: projectObj.payTotal,
              commissionTotal: projectObj.accountAndCommission.commissionAccountTotal,
              projectList: [projectObj],
              count: 1
            })
          }
        })
      })
      console.timeEnd('a')
      this.orderList = [...orderMap.values()]
      this.techList = [...techMap.values()]
      console.log(this.techList)
    },
    setFirstSendObj(attr) {
      this.firstSendObj[attr] = true
      console.log('firstSendObj', JSON.stringify(this.firstSendObj))
      if (this.firstSendObj.domReady && this.firstSendObj.getData) {
        console.log('firstSendObj ready')
        this.$refs.printWebview.send('type-change', this.rType)
        this.$refs.printWebview.send('data-change', this.orderList, this.techList, {
          paytotals: this.paytotals,
          commissionAccountTotal: this.commissionAccountTotal,
          tips: this.tips,
          projectPrices: this.projectPrices
        })
      }
    }
  },
  watch: {
    rType(val) {
      console.log('rType change')
      if (val.includes('Report')) {
        this.$refs.printWebview.send('type-change', val)
      }
    }
  },
  computed: {
    totals() {
      return (this.cashAmount + this.giftCardAmount + this.creditCardAmount).toFixed(2)
    }
  }
}
</script>
<style scoped>
.count {
  color: #909399;
  font-weight: bold;
  display: flex;
}
.count-item {
  margin-right: 15px;
}
.breadcrumb-wraper {
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex: 0 0 50px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eaeefb;
}
.table-wraper {
  display: flex;
  background-color: #fafafa;
  flex: 1;
  padding: 8px;
  overflow: hidden;
}
.print-wrapper {
  display: flex;
  background: #fff;
  border-radius: 5px;
  flex: 1;
  border: 1px solid rgb(235, 238, 245);
}
.print-func-panel {
  flex: 0 0 300px;
  border-left: 1px solid rgb(235, 238, 245);
  padding: 20px;
}
.webview {
  margin: 10px;
  flex: 1;
}
.table {
  width: 100%;
  border-radius: 5px;
}
</style>
