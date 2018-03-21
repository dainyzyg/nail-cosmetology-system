<template lang="pug">
  div(v-html='innerHTML' contenteditable="true" @focus="$emit('focus')" @blur="changeText" @keydown="keydown($event)")
</template>

<script>
export default {
  props: ['value', 'number'],
  created() {},
  data() {
    return {
      innerHTML: this.value
    }
  },
  methods: {
    keydown(e) {
      if (e.key == 'Enter') {
        this.$el.blur()
        e.preventDefault()
      }
    },
    changeText() {
      let val = this.$el.innerHTML
      if (this.number) {
        val = val === '' ? null : Number(val)
        if (val !== null && isNaN(val)) {
          this.$el.innerHTML = this.value
          return
        }
      }
      if (this.$el.innerHTML !== this.value) {
        this.$emit('input', val)
        this.$emit('change')
      }
      this.$emit('blur')
    }
  },
  computed: {},
  watch: {
    value(val) {
      console.log('editCell')
      this.innerHTML = val
    }
  }
}
</script>

<style scoped>

</style>
