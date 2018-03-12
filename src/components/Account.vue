<template lang="pug">
  el-dialog(title='结算' :visible.sync='dialogVisible' width="96vw" top="2vh" style="overflow:hidden;")
    .dialog-body.flex
      //- el-tabs(type="border-card" tab-position="left")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      //-   el-tab-pane(label="消息中心")
      .content(v-for="i in orderList")
        Tip(:data="i")
    .dialog-footer(slot='footer')
      el-button(@click="cancel") 取 消
      el-button(type='primary' @click="comfirm") 结 账
</template>

<script>
import Tip from '@/components/Tip'

export default {
  components: {
    Tip
  },
  props: {
    data: {
      default: {}
    },
    visible: {
      default: false
    },
    flex: {
      default: '1'
    }
  },
  created() {},
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    comfirm() {},
    cancel() {
      this.$emit('update:visible', false)
    }
  },
  computed: {
    orderList() {
      if (this.data.orderInfo) {
        return this.data.orderInfo
      }
      return []
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
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
.content {
  margin-right: 10px;
  border: 1px solid #ebebeb;
  padding: 10px;
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6), 0 2px 4px 0 rgba(232, 237, 250, 0.5);
  border-radius: 3px;
  display: flex;
  align-items: stretch;
  width: 250px;
}
</style>
