<template lang="pug">
tr(v-if="scoreObj")
  td(colspan="5")
    .score-progress
      span 技师得分：
      .score-progress-bar
        .score-progress-bar-filling(:style="{width:percent}")
      span {{scoreObj.score}}/{{scoreObj.targetScore}} (升级{{scoreObj.targetLevel}})
</template>
<script>
export default {
  components: {},
  props: {
    scoreObj: {
      default: null
    }
  },
  data() {
    return {
      // scoreObj: null
    }
  },
  created() {
    // alert(this.techID)
  },
  beforeDestroy() {
    // window.ipcRenderer.removeListener('asynchronous-reply', this.getData)
  },
  methods: {

  },
  computed: {
    percent() {
      if (this.scoreObj) {
        let p = this.scoreObj.score / this.scoreObj.targetScore * 100
        return `${p}%`
      }
      return '0%'
    }
  },
  watch: {}
}
</script>
<style scoped>
.score-progress {
  display: flex;
}
.score-progress-bar {
  border: 0.1vw solid #000;
  height: 2vw;
  flex: 1;
  margin-right: 0.5vw;
  border-radius: 1vw;
  overflow: hidden;
  /* padding: 0.2vw; */
}
.score-progress-bar-filling {
  /* border-radius: 0.5vw; */
  height: 100%;
  /* width: 80%; */
  background: #000;
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
