<template lang="pug">
 el-dialog(title='项目分配' :visible.sync='dialogVisible')
  el-form(:inline="true" label-width="80px" :model="formData" ref="formData" :rules="rules")
    el-form-item(label='项目' prop="order")
      el-cascader(v-model="formData.order" :options="order" @change="computeEndTime")
    el-form-item(label='技师' prop="techID")
      el-select(v-model="formData.techID" @change="computeEndTime")
        el-option(v-for="item in data.technicianList" :key="item.id" :label="item.name" :value="item.id")
    el-form-item(label='开始时间' prop="timeStart")
      el-time-picker(v-model="formData.timeStart" style="width:200px;" @change="computeEndTime")
    el-form-item(label='结束时间' prop="timeEnd")
      el-time-picker(v-model="formData.timeEnd" style="width:200px;")
    //- el-form-item(label='状态')
    //-   el-radio-group(v-model="formData.status" size="medium")
    //-     el-radio-button(label="fix") 固定
    //-     el-radio-button(label="start") 开始
  .dialog-footer(slot='footer')
    el-button(@click="dialogVisible=false") 取 消
    el-button(type='primary' @click="save") 确 定
</template>

<script>
export default {
  props: {
    visible: {
      default: false
    }
  },
  created() {},
  data() {
    return {
      order: [],
      workBeginTime: this.$algorithm.workBeginTime(),
      dateNow: this.$algorithm.getDateNow(),
      dialogVisible: false,
      formData: this.getDefalutForm(),
      data: this.$algorithm.data,
      rules: {
        order: [{ required: true, message: '项目不能为空', trigger: 'blur' }],
        techID: [{ required: true, message: '技师不能为空', trigger: 'blur' }],
        timeStart: [{ required: true, message: '开始时间不能为空', trigger: 'blur' }],
        timeEnd: [{ required: true, message: '结束时间不能为空', trigger: 'blur' }]
      }
    }
  },
  methods: {
    getDefalutForm() {
      const form = {}
      form.status = 'fix'
      form.timeStart = new Date(Math.max(this.$algorithm.workBeginTime(), this.$algorithm.getDateNow()))
      form.timeEnd = new Date(form.timeStart.getTime() + 45 * 60 * 1000)
      return form
    },
    save() {
      this.$refs['formData'].validate((valid) => {
        if (!valid) return false
        const tech = this.data.technicianList.find((x) => x.id == this.formData.techID)
        const order = this.formData.order && this.data.orderObj[this.formData.order[0]]
        const projectItem = order && order.orderInfo.find((x) => x.project.id == this.formData.order[1])
        let lastNumber = 0
        for (let item of order.orderInfo) {
          const itemNumber = item.number || 0
          if (lastNumber < itemNumber) lastNumber = itemNumber
        }
        const item = {
          id: this.$getNewID,
          techName: tech.name,
          techID: tech.id,
          orderName: order.name,
          orderID: order.id,
          number: lastNumber + 1, // 待改进
          count: order.orderInfo.length,
          orderRule: projectItem.kind.orderRule,
          projectName: projectItem.project.name,
          projectID: projectItem.project.id,
          workingTableID: projectItem.project.workingTableID,
          fixedTable: tech.fixedTableList && tech.fixedTableList.includes(projectItem.project.workingTableID),
          timeStartStr: this.$algorithm.getTimeStr(this.formData.timeStart),
          timeStart: this.getTime(this.formData.timeStart),
          timeEndStr: this.$algorithm.getTimeStr(this.formData.timeEnd),
          timeEnd: this.getTime(this.formData.timeEnd),
          duration: this.getDuration({ tech, projectItem }),
          status: 'fix'
        }
        this.$algorithm.manuallyUnshiftToAssignList(item)
        this.dialogVisible = false
      })
    },
    getTime(val) {
      return new Date(
        this.dateNow.getFullYear(),
        this.dateNow.getMonth(),
        this.dateNow.getDate(),
        val.getHours(),
        val.getMinutes(),
        val.getSeconds()
      )
    },
    computeEndTime() {
      const tech = this.data.technicianList.find((x) => x.id == this.formData.techID)
      const order = this.formData.order && this.data.orderObj[this.formData.order[0]]
      const projectItem = order && order.orderInfo.find((x) => x.project.id == this.formData.order[1])
      if (tech && order && projectItem && this.formData.timeStart) {
        const duration = this.getDuration({ tech, projectItem })
        this.formData.timeEnd = new Date(this.formData.timeStart.getTime() + duration * 60 * 1000)
      }
    },
    getDuration({ tech, projectItem }) {
      let duration = projectItem.project.standardTime || 0
      const skill = tech.skillInfo[projectItem.project.id] || {}
      let durationDiff = skill.timeDiff || 0
      for (let add of projectItem.additions) {
        duration += add.standardTime || 0
        let addSkill = tech.skillInfo[add.id] || {}
        durationDiff += addSkill.timeDiff || 0
      }
      return duration + durationDiff
    },
    setOrder() {
      const orderList = []
      Object.keys(this.data.orderObj).forEach((x) => {
        let order = this.data.orderObj[x]
        if (order.isArrive && order.isfree) {
          orderList.push(order)
        }
      })

      orderList.sort((x, y) => {
        let pX = x.timePositions[0]
        let pY = y.timePositions[0]
        if (pX.time.getTime() == pY.time.getTime()) {
          return pX.number - pY.number
        }
        return pX.time - pY.time
      })
      this.order = orderList.map((x) => {
        return {
          value: x.id,
          label: x.name,
          children: x.orderInfo.filter((t) => !t.assignItemID).map((m) => {
            return { value: m.project.id, label: m.project.name }
          })
        }
      })
    }
  },
  computed: {
    orderOld() {
      const orderList = []
      Object.keys(this.data.orderObj).forEach((x) => {
        let order = this.data.orderObj[x]
        if (order.isArrive && order.isfree) {
          orderList.push(order)
        }
      })

      orderList.sort((x, y) => {
        let pX = x.timePositions[0]
        let pY = y.timePositions[0]
        if (pX.time.getTime() == pY.time.getTime()) {
          return pX.number - pY.number
        }
        return pX.time - pY.time
      })
      return orderList.map((x) => {
        return {
          value: x.id,
          label: x.name,
          children: x.orderInfo.filter((t) => !t.assignItemID).map((m) => {
            return { value: m.project.id, label: m.project.name }
          })
        }
      })
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
    },
    dialogVisible(val) {
      if (val) {
        this.setOrder()
        this.formData = this.getDefalutForm()
      }
      this.$emit('update:visible', val)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
