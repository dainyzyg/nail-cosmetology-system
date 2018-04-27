<template lang="pug">
  .wrapper.flex-c
    .info
      .info-line.project
        .info-title {{data.project.name}}
        .info-value ${{data.project.price}}
      .info-line(v-for="i in data.additions")
        .info-title {{i.name}}
        .info-value ${{i.price}}
      .info-line.technician
        .info-title 总计
        .info-value ${{sumv}}
    .number.flex-c
      .tip
        .tip-title 技师：{{technician}} 小费：
        .tip-value {{fee}}
      .number-line.flex(v-for="row in 3")
        .numberBtn(v-for="col in 3" @click="tap((row-1)*3+col)") {{(row-1)*3+col}}
      .number-line.flex
        .numberBtn(@click="clear") 清除
        .numberBtn(@click="tap(0)") 0
        .numberBtn(@click="tap('.')") .
</template>

<script>
export default {
  props: {
    technician: {
      default: ''
    },
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
      fee: 0,
      feeStr: '0',
      dialogVisible: false
    }
  },
  methods: {
    clear() {
      this.feeStr = '0'
      this.fee = 0
    },
    tap(num) {
      this.feeStr += `${num}`
      this.fee = Number(this.feeStr)
    },
    comfirm() {},
    cancel() {
      this.$emit('update:visible', false)
    }
  },
  computed: {
    sumv() {
      let price = this.data.project.price || 0
      this.data.additions.forEach(a => {
        let p = a.price || 0
        price += p
      })
      return price + this.fee
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
.wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
}
.info {
  flex: 1;
}
.number {
  height: 240px;
}
.number-line {
  align-items: stretch;
  flex: 1;
  border-top: 1px solid slategray;
}
.numberBtn {
  font-size: 18px;
  flex: 1;
  display: flex;
  display: flex;
  justify-content: center;
  align-items: center;
}
.numberBtn:not(:last-child) {
  border-right: 1px solid slategray;
}
.tip {
  font-size: 18px;
  line-height: 30px;
  height: 30x;
  display: flex;
  justify-content: space-between;
}
.tip-title {
}
.tip-value {
  font-size: 24px;
}
.info-line {
  font-size: 14px;
  line-height: 22px;
  height: 22px;
  display: flex;
  justify-content: space-between;
}
.info-title {
}
.info-value {
}
.technician {
  border-top: 1px dashed slategray;
}
.project {
  border-bottom: 1px dashed slategray;
}
</style>
