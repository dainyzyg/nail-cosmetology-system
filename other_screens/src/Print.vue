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
          th 技师星级
          th 技师小费$
          th 单价总数$
          th 技师提成$
          th 利润$
      tbody
        tr(v-for="i in techList")
          td.align-center {{i.name}}
          td.align-right {{(i.rates/i.count).toFixed(2)}}
          td.align-right {{i.tips}}
          td.align-right {{i.projectPrices}}
          td.align-right {{fixed2(i.commissionTotal)}}
          td.align-right {{fixed2(i.projectPrices-correctNum(i.commissionTotal))}}
      tfoot
        tr
          th(colspan="6" style="text-align:right") 营业总数:${{aggregatedData.paytotals}} 提成总数:${{commissionAccountTotal}} 利润总数:{{profits}}
    table( v-if="reportType=='techReport'" v-for="i in techList" cellspacing="0" cellpadding="0" style="width:100%;page-break-after: always;")
      caption 技师报单
      tfoot
        tr
          th(colspan="5" style="text-align:right") 单价总数:${{i.projectPrices}} 提成总数:${{fixed2(i.commissionTotal)}} 小费总数:${{i.tips}} 平均星级:{{(i.rates/i.count).toFixed(2)}} 技师收入:${{fixed2(i.commissionTotal+i.tips)}}
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
          td.align-right {{p.tip}}
          td.align-right {{p.rate}}
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

export default {
  components: {},
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
      this.reportType = type;
    },
    getQueryString(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
      var r = window.location.search.substr(1).match(reg);
      if (r != null) return unescape(r[2]);
      return null;
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
      return this.fixed2(this.aggregatedData.commissionAccountTotal)
    },
    profits() {
      return this.fixed2(this.aggregatedData.paytotals - this.aggregatedData.tips - this.correctNum(this.aggregatedData.commissionAccountTotal))
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
