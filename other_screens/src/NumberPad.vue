<template lang="pug">
.wrapper
  .close(@click="close") x
  .number-show {{number}}
  .input-number
    .group1
      .number-group
        .number-line
          .number-double
            .number(v-for="i in [7,8]" @click="inputNumber(i)") {{i}}
          .number(@click="inputNumber(9)") 9
        .number-line
          .number-double
            .number(v-for="i in [4,5]" @click="inputNumber(i)") {{i}}
          .number(@click="inputNumber(6)") 6
      .btn(@click="number='0'") clear
    .group1
      .number-group
        .number-line
          .number-double
            .number(v-for="i in [1,2]" @click="inputNumber(i)") {{i}}
          .number(@click="inputNumber(3)") 3
        .number-line
          .number-double.number-0(@click="inputNumber(0)") 0
          .number(@click="inputNumber('.')") .
      .btn(@click="confirm") confirm
</template>

<script>
export default {
  props: ['show'],
  data() {
    return {
      a: 'aaa',
      number: '0'
    }
  },
  async created() {
    window.ipcRenderer.on('receive-order-info', this.receiveOrderInfo)
  },
  methods: {
    inputNumber(i) {
      if (i == '.') {
        if (this.number.search(/\./) < 0) {
          this.number = `${this.number}${i}`
        }
      } else if (this.number == '0') {
        this.number = `${i}`
      } else {
        this.number = `${this.number}${i}`
      }
    },
    close() {
      this.$emit('update:show', false)
    },
    confirm() {
      this.$emit('numberChange', Number(this.number))
      this.$emit('update:show', false)
      // window.ipcRenderer.send('send-fee', 998)
    },
    receiveOrderInfo(event, arg) {
      console.log(arg)
    }
  },
  watch: {
    show(val) {
      this.number = '0'
    }
  }
}
</script>

<style scoped>
div {
  box-sizing: border-box;
}
.info {
  flex: 1;
}
.wrapper {
  background-color: slategray;
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  width: 400px;
  /* border: 1px solid #ebebeb; */
  box-shadow: 0 0 8px 0 rgba(112, 128, 144, 0.6), 0 2px 4px 0 rgba(112, 128, 144, 0.5);
}
.close {
  position: absolute;
  top: 0;
  left: 0;
  padding-left: 10px;
  width: 50px;
  height: 50px;
  font-size: 30px;
  color: white;
  cursor: pointer;
}
.number-show {
  color: #fff;
  font-size: 30px;
  font-weight: bolder;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: absolute;
  left: 0;
  right: 10px;
  bottom: 400px;
}
.input-number {
  background-color: #fff;
  color: slategray;
  font-size: 18px;
  font-weight: bolder;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  height: 400px;
  width: 400px;
}
.group1 {
  flex: 1;
  display: flex;
  /* border-top: 1px solid slategray; */
}
.number-group {
  display: flex;
  flex-direction: column;
  flex: 3;
}
.btn {
  font-size: 18px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 2px solid slategray;
  border-top: 2px solid slategray;
}
.number-line {
  display: flex;
  flex: 1;
  border-top: 2px solid slategray;
}
.number {
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  flex: 1;
}
.number:first-child {
  border-right: 2px solid slategray;
}
.number:active,
.number-0:active,
.btn:active {
  background: slategray;
  color: #fff;
}
.number-double {
  justify-content: center;
  align-items: center;
  display: flex;
  flex: 2;
  border-right: 2px solid slategray;
}
</style>
