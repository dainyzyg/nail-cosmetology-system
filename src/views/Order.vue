<template lang="pug">
.page.col
  .breadcrumb-wraper
    el-radio-group(v-model='rType' size="medium")
      el-radio-button(label="waiting") 待结账
      el-radio-button(label="completed") 已结账
    el-button(@click="check" icon="el-icon-tickets" size="medium" type="primary") 结账
  .table-wraper
    template(v-if="rType=='waiting'")
      el-table.table(key="waiting" @selection-change="handleSelectionChange" ref="table1" :data="waitingCheckList" border height="calc(100vh - 66px)")
        el-table-column(type="selection" width="36")
        el-table-column(prop="name" label="姓名" width="150" align="center" header-align="center")
        el-table-column(prop="phone" label="电话" width="150" header-align="center")
        el-table-column(prop="orderInfo" :formatter="orderInfoFormatter" label="项目" header-align="center")
        //- el-table-column(prop="checkout" label="是否结账" width="80" align="center" header-align="center")
        //-   template(slot-scope="scope")
        //-     .blue-font {{scope.row.checkout?'已结账':'未结账'}}
        el-table-column(prop="orderDate" :formatter="timeFormatter" label="订单时间" align="center" header-align="center" width="100")
        el-table-column(prop="isArrive" :formatter="isArriveFormatter" label="是否到店" align="center" header-align="center" width="120")
        el-table-column(prop="orderInfo" :formatter="accountFormatter" label="金额$" align="right" header-align="center" width="120")
    template(v-if="rType=='completed'")
      el-table.table(key="complete" :data="completedCheckList" border height="calc(100vh - 66px)")
        //- el-table-column(type="selection" width="36")
        el-table-column(prop="name" label="姓名" align="center" width="150" header-align="center")
        el-table-column(prop="phone" label="电话" width="150" header-align="center")
        el-table-column(prop="orderInfo" :formatter="orderInfoFormatter" label="项目" header-align="center")
        //- el-table-column(prop="checkout" label="是否结账" width="80" align="center" header-align="center")
        //-   template(slot-scope="scope")
        //-     .blue-font {{scope.row.checkout?'已结账':'未结账'}}
        el-table-column(prop="orderDate" :formatter="timeFormatter" label="订单时间" align="center" header-align="center" width="100")
        el-table-column(prop="isArrive" :formatter="isArriveFormatter" label="是否到店" align="center" header-align="center" width="120")
        el-table-column(prop="orderInfo" :formatter="accountFormatter" label="金额$" align="right" header-align="center" width="120")
  Account(:visible.sync="accountVisible" :data="checkoutProjectList")
</template>
<script>
import PanelSelect from '@/components/PanelSelect'
import OrderInfoPanel from '@/components/OrderInfoPanel'
import Account from '@/components/Account'

export default {
  components: {
    PanelSelect,
    OrderInfoPanel,
    Account
  },
  data() {
    return {
      rType: 'waiting',
      data: this.$algorithm.data,
      multipleSelection: [],
      accountVisible: false
    }
  },
  created() {
    // 获取待结账、已结账列表
    // this.getCheckList()
  },
  beforeDestroy() {
    // clearInterval(this.setIntervalIndex)
    // window.ipcRenderer.removeListener('asynchronous-reply', this.getPreAssignList)
  },
  methods: {
    // getCheckList() {
    //   // 获取待结账、已结账列表
    //   let waitingCheckList = []
    //   let completedCheckList = []
    //   this.checkList.forEach(order => {
    //     if (order.checkout) {
    //       completedCheckList.push(order)
    //     } else if (order.orderInfo.length > 0 && order.orderInfo.every(e => e.status == 'end')) {
    //       waitingCheckList.push(order)
    //     }
    //   })
    //   this.waitingCheckList = waitingCheckList
    //   this.completedCheckList = completedCheckList
    // },
    chectout() {
      console.log('chectout')
    },
    check() {
      if (this.checkoutProjectList.length <= 0) {
        this.$message({
          showClose: true,
          message: '请选择订单',
          type: 'error'
        })
        return
      }
      this.accountVisible = true
      // window.ipcRenderer.send('notice-fee-screen', { checkoutProjectList: this.checkoutProjectList })
      // console.log(this.selectedUsers)
    },
    handleSelectionChange(val) {
      console.log(val)
      this.multipleSelection = val
    },
    cancelSelect() {
      this.$refs.table1.clearSelection()
    },

    focus() {
      // clearInterval(this.st)
    },
    checkoutFormatter(row, column, cell) {
      if (row.tipObj) {
        const checkoutUsers = []
        for (let tabID in row.tipObj) {
          if (tabID == 1) {
            checkoutUsers.push(row.name)
          } else {
            const other = row.otherFormDatas.find(x => x.tabID == tabID)
            if (other) {
              checkoutUsers.push(other.name)
            }
          }
        }
        return checkoutUsers.join(',')
      }
      return ''
    },
    orderInfoFormatter(row, column, cell) {
      if (cell) {
        const projectList = []
        for (let item of cell) {
          projectList.push(item.project.name)
        }
        return projectList.join(',')
      }
      return ''
    },
    accountFormatter(row, column, cell) {
      if (cell) {
        let total = 0
        cell.forEach(item => {
          let price = item.project.price || 0
          item.additions.forEach(a => {
            let p = a.price || 0
            price += p
          })
          if (item.checkoutInfo) {
            price += item.checkoutInfo.tip
          }
          total += price
        })
        return total.toFixed(2)
      }
      return ''
    },
    isArriveFormatter(row, column, cell) {
      switch (cell) {
        case 'arrive':
          return '到场'
        case 'arriveNoCompute':
          return '到场不参与计算'
        case 'notArrive':
          return '未到场'
        default:
          return ''
      }
    },
    timeFormatter(row, column, cell) {
      if (cell) {
        return cell.toLocaleTimeString('en')
      }
      return ''
    }
  },
  watch: {
    rType() {
      this.multipleSelection = []
    }
  },
  computed: {
    waitingCheckList() {
      return Object.values(this.data.orderObj).filter(
        order =>
          order.orderInfo.length > 0 &&
          order.orderInfo.every(e => e.status == 'end') &&
          !order.orderInfo.every(e => e.checkoutInfo)
      )
    },
    completedCheckList() {
      return Object.values(this.data.orderObj).filter(
        order =>
          order.orderInfo.length > 0 &&
          order.orderInfo.every(e => e.status == 'end') &&
          order.orderInfo.every(e => e.checkoutInfo)
      )
    },
    checkoutProjectList() {
      const list = []
      // debugger
      this.multipleSelection.forEach(e => {
        e.orderInfo.forEach(o => {
          const item = this.data.assignList.find(x => x.id == o.assignItemID)
          list.push({
            ...o,
            ...e,
            technicianName: item.techName,
            technicianID: item.techID,
            accountAndCommission: item.accountAndCommission,
            tip: 0,
            rate: 0
          })
        })
      })
      // debugger
      return list
    }
  }
}
</script>
<style scoped>
.blue-font {
  color: #409eff;
}
.checkout-title {
  color: #606266;
}
.checkout-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}
.margin-left {
  margin-left: 10px;
}
.arrive-title {
  padding-left: 10px;
  padding-right: 10px;
}
.tab-title i {
  line-height: 40px;
  font-size: 30px;
  cursor: pointer;
  color: #999;
  margin-right: 10px;
}
.tab-title {
  display: flex;
  align-items: flex-start;
}
.btns i {
  font-size: 35px;
  margin: 20px 0;
  cursor: pointer;
}
.btns {
  flex: 0 0 35px;
  margin-right: 10px;
  justify-content: center;
  align-items: center;
}
.project-wrapper {
  padding-top: 10px;
  flex: 1;
  border-top: 1px solid #dcdfe6;
}
.dialog-body {
  height: calc(96vh - 86px - 70px - 60px);
}
.row {
  height: 50px;
  width: 400px;
  border: 1px solid #999;
}
.draghandle {
  font-size: 25px;
  font-weight: bolder;
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
  background-color: #fafafa;
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-radius: 5px;
}
</style>
<style>
.table-cell {
  padding: 2px 0 !important;
}
</style>
