<template lang="pug">
  .page
    //- div(style="background:red;width:200px;height:100px;" @click="print1")
    //- 营业报表
    //- h1 {{reportType}}
    table(v-if="reportType=='businessReport'" key="yingye" cellspacing="0" cellpadding="0" style="width:100%;page-break-after: always;")
      caption 营业报表
      colgroup
        col
        col
      thead(style="display:table-header-group;")
        tr
          th 技师姓名
          th 技师星级1
          th 小费总数$
          th 等待费用$
          th 单价总数$
          th 技师提成$
          th 利润$
      tbody
        tr(v-for="i in techList")
          td.align-center {{i.name}}
          td.align-right {{isNaN(i.rates/i.count)?'':(i.rates/i.count).toFixed(2)}}
          //- td.align-right {{(i.tips||0)+(i.subsidys||0)}}
          td.align-right {{i.tips}}+{{i.subsidys}}
          td.align-right {{i.waitingPriceTotal||0}}
          td.align-right {{i.projectPrices}}
          td.align-right {{fixed2(i.commissionTotal)}}
          td.align-right {{fixed2(i.projectPrices-correctNum(i.commissionTotal))}}
      tfoot
        tr
          th
            | 营业总数
            br
            | ${{aggregatedData.projectPrices}}
          th
            | 提成总数
            br
            | ${{aggregatedData.commissionAccountTotal}}
          th
            | 小费补贴
            br
            | ${{aggregatedData.subsidyTotal}}
          th
            | 等待费用
            br
            | ${{aggregatedData.waitingPriceTotal}}
          th
            | 利润总数
            br
            | ${{profits}}
          th
          th
        tr
          th
            | 实收总数
            br
            | ${{aggregatedData.paytotals}}
          th
            | 现金
            br
            | ${{aggregatedData.cashAmount}}
          th
            | 礼卡
            br
            | ${{aggregatedData.giftCardAmount}}
          th
            | 信用卡
            br
            | ${{aggregatedData.creditCardAmount}}
          th
            | 优惠券
            br
            | ${{aggregatedData.couponAmount}}
          th
            | 现金盈亏
            br
            | ${{cashProfits}}
          th
        //- tr
        //-   th(colspan="7" style="text-align:right") 营业总数:${{aggregatedData.projectPrices}} 提成总数:${{commissionAccountTotal}} 小费补贴:${{aggregatedData.subsidyTotal}} 等待费用:${{aggregatedData.waitingPriceTotal}} 利润总数:${{profits}}
        //- tr
        //-   th(colspan="7" style="text-align:right") 实收总数:${{aggregatedData.paytotals}} 其中现金:${{aggregatedData.cashAmount}} 礼卡:${{aggregatedData.giftCardAmount}} 信用卡:${{aggregatedData.creditCardAmount}} 优惠券:${{aggregatedData.couponAmount}} 现金盈亏:${{cashProfits}}
    table( v-if="reportType=='techReport'" v-for="i in techList" cellspacing="0" cellpadding="0" style="width:100%;page-break-after: always;")
      caption 技师报单
      tfoot
        tr
          th(colspan="5" style="text-align:right") 单价总数:${{i.projectPrices}} 提成总数:${{fixed2(i.commissionTotal)}} 小费总数:${{i.tips+i.subsidys}} 等待费用:${{i.waitingPriceTotal||0}} 平均星级:{{(i.rates/i.count).toFixed(2)}} 技师收入:${{correctNum(i.commissionTotal+i.tips+i.subsidys+(i.waitingPriceTotal||0))}}
      colgroup
        col
        col
      thead(style="display:table-header-group;")
        tr
          th(colspan="5" style="text-align:left") 技师名字:  {{i.name}}
        tr
          th 顾客姓名
          th 单价$
          th 提成$
          th 小费$
          th 星级
      tbody
        tr(v-for="p in i.projectList")
          td.align-center {{p.orderName}}
          td.align-right {{p.projectPrice}}
          td.align-right {{fixed2(p.accountAndCommission.commissionAccountTotal)}}
          td.align-right {{getTip(p)}}
          td.align-right {{p.rate}}
        tr(v-for="p in i.waitingTimeList")
          td.align-center 等待时间
          td(colspan="4") ${{p.waitingPrice}},{{p.waitingTime}}分钟，跳过项目:{{p.orderName}}-{{p.projectName}},等待项目:{{getWaitingForProject(p)}}
        ScoreProgress(:scoreObj="i.scoreObj")
            //- .score-progress
            //-   span 技师得分：
            //-   .score-progress-bar
            //-     .score-progress-bar-filling
            //-   span 500/1000 (升级中工)
    table(v-if="false" cellspacing="0" cellpadding="0" style="width:100%;page-break-after: always;")
      colgroup
        col
        col
      thead(style="display:table-header-group;")
        tr
          th 顾客姓名
          th 电话
          th 项目
          th 小费$
          th 项目费用$
          th 应收合计$
      tbody
        tr(v-for="i in orderList")
          td.align-center {{i.name}}
          td {{i.phone}}
          td {{i.projects}}
          td.align-right {{i.tips}}
          td.align-right {{i.projectPrice}}
          td.align-right {{i.payTotal}}
        tr(v-for="i in orderList")
          td.align-center {{i.name}}
          td {{i.phone}}
          td {{i.projects}}
          td.align-right {{i.tips}}
          td.align-right {{i.projectPrice}}
          td.align-right {{i.payTotal}}
        tr(v-for="i in orderList")
          td.align-center {{i.name}}
          td {{i.phone}}
          td {{i.projects}}
          td.align-right {{i.tips}}
          td.align-right {{i.projectPrice}}
          td.align-right {{i.payTotal}}
</template>
<script>
import ScoreProgress from './ScoreProgress.vue'

export default {
  components: {
    ScoreProgress
  },
  data() {
    return {
      aggregatedData: {},
      reportType: '',
      orderList: [],
      techList: []
    }
  },
  created() {
    // require('electron').remote.getCurrentWebContents().print({printBackground:true})
    // window.ipcRenderer.on('asynchronous-reply', this.getData)
    // this.getData()
    // alert('asdasd')
    const ipcRenderer = window.electron.ipcRenderer
    ipcRenderer.sendToHost('dom-ready')
    ipcRenderer.on('data-change', this.receiveData)
    ipcRenderer.on('print', this.print)
    ipcRenderer.on('type-change', this.setType)
  },
  beforeDestroy() {
    // window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },
  methods: {
    getTip(p) {
      console.log(p.subsidy, p)
      if (p.subsidy > 0) {
        return `${p.tip}+${p.subsidy}`
      }
      return p.tip
    },
    getWaitingForProject({ waitforAssianItem }) {
      if (!waitforAssianItem) return '无'
      return `${waitforAssianItem.orderName}-${waitforAssianItem.projectName}`
    },
    correctNum(val) {
      if (isNaN(val)) {
        return NaN
      }
      let num = Math.round(val * 1000000) / 1000000
      return num
    },
    fixed2(val) {
      let num = this.correctNum(val)
      if (isNaN(num)) {
        return ''
      }
      return num.toFixed(2)
    },
    setType(event, type) {
      this.reportType = type
    },
    getQueryString(name) {
      var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
      var r = window.location.search.substr(1).match(reg)
      if (r != null) return unescape(r[2])
      return null
    },
    receiveData(event, orderList, techList, aggregatedData) {
      this.orderList = orderList
      this.techList = techList
      this.aggregatedData = aggregatedData
      console.log(this.techList)
    },
    print1() {
      window.alert('asdasd')
      const ipcRenderer = window.electron.ipcRenderer
      ipcRenderer.sendToHost('pong')
    },
    print() {
      window.print()
      // window.electron.remote.getCurrentWebContents().print({ silent: false })
    }
  },
  computed: {
    commissionAccountTotal() {
      return this.correctNum(this.aggregatedData.commissionAccountTotal)
    },
    profits() {
      return this.correctNum(
        this.aggregatedData.projectPrices -
          this.aggregatedData.subsidyTotal -
          this.aggregatedData.waitingPriceTotal -
          this.aggregatedData.commissionAccountTotal
      )
    },
    cashProfits() {
      // alert(`${this.profits} - this.giftCardAmount - this.creditCardAmount - this.couponAmount`)
      return this.correctNum(
        this.profits -
          this.aggregatedData.giftCardAmount -
          this.aggregatedData.creditCardAmount -
          this.aggregatedData.couponAmount
      )
    }
  },
  watch: {}
}
</script>
<style scoped>
.page {
  font-size: 2vw;
  line-height: 2.5vw;
}
caption {
  font-size: 3vw;
  line-height: 4.5vw;
  font-weight: bold;
}
.align-right {
  text-align: right;
}
.align-center {
  text-align: center;
}
td,
th {
  word-break: break-all;
  border-right: 0.1vw solid #000;
  border-bottom: 0.1vw solid #000;
  padding: 1vw;
}
td:first-child,
th:first-child {
  border-left: 0.1vw solid #000;
}
thead tr:first-child th {
  border-top: 0.1vw solid #000;
}
/* table {
  margin-top: 10px;
  page-break-inside: avoid;
} */
tr {
  /* height: 100px; */
  page-break-inside: avoid;
}
</style>
