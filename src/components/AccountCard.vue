<template lang="pug">
  .content(:class="{hasTip:tip}")
    .title {{data.userName}}
    .info-line.border-bottom
      .info-title {{data.project.name}}
      .info-value ${{data.project.price}}
    .info-line(v-for="i in data.additions")
      .info-title {{i.name}}
      .info-value ${{i.price}}
    .info-line.border-top
      .info-title 技师
      .info-value {{getTechnician(data)}}
    .info-line
      .info-title 小费
      .info-value ${{tip}}
    .info-line.border-top
      .info-title 总计
      .info-value ${{total}}
</template>

<script>
export default {
  props: {
    data: {
      default: {}
    },
    tipList: {
      default: []
    }
  },
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    getTechnician(data) {
      const item = data.preAssignItems.find((x) => x.projectID == data.project.id)
      return item.technicianName
    }
  },
  computed: {
    total() {
      let price = this.data.project.price || 0
      this.data.additions.forEach((a) => {
        let p = a.price || 0
        price += p
      })
      price += this.tip || 0
      return price.toFixed(2)
    },
    tip() {
      const tipItem = this.tipList.find((x) => x.projectID == this.data.project.id && x.id == this.data.id)
      if (tipItem) {
        return tipItem.tip
      }
      return ''
    }
  },
  watch: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.border-bottom {
  border-bottom: 1px dashed slategray;
}
.border-top {
  border-top: 1px dashed slategray;
}
.info-line {
  font-size: 14px;
  line-height: 22px;
  height: 22px;
  display: flex;
  justify-content: space-between;
}
.content {
  margin-right: 10px;
  border: 1px solid #ebebeb;
  padding: 0 10px;
  box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6), 0 2px 4px 0 rgba(232, 237, 250, 0.5);
  border-radius: 5px;
  /* display: flex;
  align-items: stretch; */
  width: 250px;
}
.hasTip {
  border: 1px solid #409eff;
}
.title {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bolder;
  border-bottom: 1px solid #ebebeb;
}
</style>
