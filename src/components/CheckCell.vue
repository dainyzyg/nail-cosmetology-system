<template lang="pug">
  .check-box(@click="check")
    i.el-icon-check(v-if="show")
</template>

<script>
export default {
  props: ['value', 'label'],
  created() {},
  data() {
    return {}
  },
  methods: {
    check() {
      if (this.label) {
        if (this.label == this.value) {
          this.$emit('input', null)
        } else {
          this.$emit('input', this.label)
        }
      } else {
        this.$emit('input', !this.value)
      }
      this.$emit('change')
    }
  },
  computed: {
    show() {
      if (this.label) {
        return this.label == this.value
      }
      return this.value
    }
  },
  watch: {}
}
</script>

<style scoped>
.check-box {
  cursor: pointer;
}
</style>
