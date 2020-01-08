<template lang="pug">
  .page.col(v-if="true")
    .header 下单程序地址：http://{{address}}
    .header 技师端程序地址：http://{{address}}/mobile
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
  padding: 50px;
  padding-bottom: 0;
  color: #606266;
}
.content {
  flex: 1;
  display: flex;
}
</style>
