<template lang="pug">
  el-dialog(title='结算' :visible.sync='dialogVisible' width="96vw" top="2vh" style="overflow:hidden;")
    .dialog-body.flex
      //- el-tabs(type="border-card" tab-position="left")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      AccountCard(v-for="i in data" ref="accountCardlist" :data="i" :tipList="tipList" :key="`${i.id}${i.project.id}`")
    .dialog-footer(slot='footer')
      .total 总计：{{total}}
      .btns
        el-button(@click="cancel") 取 消
        el-button(type='success' @click="openScreen") 小费屏幕
        el-button(type='primary' @click="comfirm") 结 账
</template>

<script>
import AccountCard from '@/components/AccountCard'

export default {
  components: {
    AccountCard
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
    window.ipcRenderer.on('receive-fee', this.receiveFee)
  },
  beforeDestroy() {
    // clearInterval(this.setIntervalIndex)
    window.ipcRenderer.removeListener('receive-fee', this.receiveFee)
  },
  data() {
    return {
      dialogVisible: false,
      tipList: []
    }
  },
  methods: {
    openScreen() {
      window.ipcRenderer.send('notice-fee-screen', { checkoutProjectList: this.data })
    },
    receiveFee(event, tipList) {
      this.tipList = tipList
    },
    async comfirm() {
      const promiseList = [...new Set(this.data.map((m) => m.orderID))].map((orderID) => {
        const tipObj = {}
        this.tipList.forEach((tip) => {
          if (tip.orderID == orderID) {
            tipObj[tip.tabID] = tipObj[tip.tabID] || []
            tipObj[tip.tabID].push(tip)
          }
        })
        return this.setorderTip(orderID, tipObj)
      })
      await Promise.all(promiseList)
      this.$emit('update:visible', false)
      this.$emit('chectout')
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
    total() {
      let priceTotal = 0
      this.data.forEach((d) => {
        let price = d.project.price || 0
        d.additions.forEach((a) => {
          let p = a.price || 0
          price += p
        })
        const tipItem = this.tipList.find((x) => x.projectID == d.project.id && x.id == d.id)
        price += (tipItem && tipItem.tip) || 0
        priceTotal += price || 0
      })
      return priceTotal.toFixed(2)
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      this.tipList = []
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-body {
  height: calc(96vh - 54px - 70px - 60px);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>
