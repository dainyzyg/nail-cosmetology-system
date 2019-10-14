<template lang="pug">
  .page.col(v-if="true")
    .header 请使用PC或移动端浏览器访问：http://{{address}}
</template>
<script>
export default {
  components: {},
  data() {
    return {
      address: ''
    }
  },
  created() {
    this.getIPAdress()
  },
  methods: {
    getIPAdress() {
      this.address = this.$algorithm.getIPAdress()
    }
  }
}
</script>
<style scoped>
.header {
  /* background: slategray; */
  flex: 0 0 50px;
  font-size: 30px;
  padding: 30px;
  color: #606266;
}
.content {
  flex: 1;
  display: flex;
}
</style>
