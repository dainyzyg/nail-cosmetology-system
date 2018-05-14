<template lang="pug">
  .wrapper(ref="wrapper")
    .header
      .empty
      .mark-wrapper
        .mark-content 12345678909876543212345678
    .content
      .left
        .line(v-for="i in 30") {{i}}
      .right
        .clock-wrapper
          .line(v-for="i in 30") {{i}}
    //- .top(ref="top") 123123123131313
    //- .left(ref="left")
    //-   h1(v-for="i in 30") {{i}}
    //- .right(ref="right")
    //-   h1(v-for="i in 30") {{i}}
    //- .header
    //-   .first 1
    //-   .second 2
    //- .content(@scroll="scroll" ref="content")
    //-   .first(ref="technamewrapper")
    //-     h1(v-for="i in 30") {{i}}
    //-   .second
    //-     .clock-wrapper
    //-       h1(v-for="i in 30") {{i}}
    //- .tec-name-wrapper(ref="b")
    //-   h1(v-for="i in 30") {{i}}
    //- .clock-wrapper
    //-   .clock-content(@scroll="YScroll" ref="a")
    //-     .mark
    //-       .mark-item(v-for="i in 10") {{i+10}}
    //-     h1(v-for="i in 30") {{i}}
</template>

<script>
export default {
  props: [],
  created() {},
  data() {
    return {}
  },
  methods: {
    scroll() {
      this.$refs.top.style.top = this.$refs.wrapper.scrollTop + 'px'
      this.$refs.left.style.left = this.$refs.wrapper.scrollLeft + 'px'
    },
    YScroll(a, b) {
      console.log(this.$refs.a.scrollTop)
      console.log(this.$refs.b)
      console.log(a, b)
      this.$refs.b.scrollTop = this.$refs.a.scrollTop
    }
  },
  computed: {},
  watch: {}
}
</script>

<style scoped>
.line {
  border-bottom: 1px solid slategray;
}
.wrapper {
  flex: 1;
  display: flex;
  overflow: auto;
  flex-direction: column;
}
.header {
  z-index: 1;
  position: sticky;
  top: 0px;
  flex: 0 0 20px;
  display: flex;
}
.empty {
  position: sticky;
  left: 0px;
  flex: 0 0 100px;
  background: white;
}
.mark-wrapper {
  flex: 1;
}
.content {
  flex: 1;
  display: flex;
}
.left {
  position: sticky;
  left: 0px;
  flex: 0 0 100px;
  background: rebeccapurple;
}
.right {
  flex: 1;
  background: red;
}
.clock-wrapper {
  width: 200%;
  background: turquoise;
}
.mark-content {
  width: 200%;
  height: 100%;
  background: white;
}
.mark {
  position: absolute;
  left: 0;
  right: 0;
  top: 20px;
  box-sizing: border-box;
  height: 20px;
  display: flex;
  border-bottom: 1px solid #909399;
}
.mark-item {
  display: flex;
  flex: 1;
}
</style>
