<template lang="pug">
  .check-box(@click="check")
    i.el-icon-check(v-if="value")
</template>

<script>
export default {
  props: ['value'],
  created() {},
  data() {
    return {}
  },
  methods: {
    check() {
      this.$emit('input', !this.value)
      this.$emit('change')
    }
  },
  computed: {},
  watch: {}
}
</script>

<style scoped>
.check-box {
  cursor: pointer;
}
</style>
