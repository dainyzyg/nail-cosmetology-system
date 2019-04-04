<template lang="pug">
 el-dialog(title='修改项目' :visible.sync='dialogVisible')
  el-form(label-width="80px" :model="formData" ref="formData" :rules="rules")
    el-form-item(label='项目' required)
      el-col(:span="12")
        el-form-item(prop="kindProjectArray")
          el-cascader(v-model="formData.kindProjectArray" :options="kindProjectOption" @change="changeProject")
      el-col(:span="12")
        .plain-text 技师/顾客
        | {{formData.techName}}/{{formData.orderName}}
    el-form-item(label='小项' prop="additionArray")
      el-select(multiple v-model="formData.additionArray" style="width:100%;" @change="computeEndTime")
        el-option(v-for="item in additionOption" :key="item.value" :label="item.label" :value="item.value")
    el-form-item(label='开始时间' required)
      el-col(:span="12")
        el-form-item(prop="timeStart")
          el-time-picker(v-model="formData.timeStart" @change="computeEndTime")
      el-col(:span="12")
        el-form-item(label='结束时间' prop="timeEnd")
          el-time-picker(v-model="formData.timeEnd")
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
    },
    assignItem: {
      default: {}
    }
  },
  created() {
    this.initData()
  },
  data() {
    return {
      kindList: [],
      projectList: [],
      additionList: [],
      kindProjectOption: [],
      additionOption: [],
      tech: null,
      order: null,
      projectItem: null,
      workBeginTime: this.$algorithm.workBeginTime(),
      dateNow: this.$algorithm.getDateNow(),
      dialogVisible: false,
      formData: {},
      data: this.$algorithm.data,
      rules: {
        kindProjectArray: [
          { required: true, message: '项目不能为空', trigger: 'blur' }
        ],
        timeStart: [
          { required: true, message: '开始时间不能为空', trigger: 'blur' }
        ],
        timeEnd: [
          { required: true, message: '结束时间不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    changeProject(val) {
      this.setAdditionOption(val)
      this.computeEndTime()
    },
    setAdditionOption(kindProjectArray) {
      this.additionOption = this.additionList
        .filter(f => f.parentID == kindProjectArray[1])
        .sort((a, b) => {
          let indexA = a.index
          let indexB = b.index

          if (a.index == null) {
            indexA = a.id
          }
          if (b.index == null) {
            indexB = b.id
          }
          return indexA - indexB
        })
        .map(m => {
          return { value: m.id, label: m.name }
        })
      this.formData.additionArray = []
    },
    async initData() {
      console.time('initData')
      ;[this.kindList, this.projectList, this.additionList] = await Promise.all(
        [
          this.$IDB.getAll('kind'),
          this.$IDB.getAll('project'),
          this.$IDB.getAll('addition')
        ]
      )
      console.timeEnd('initData')
      this.kindProjectOption = this.kindList.map(kind => {
        return {
          value: kind.id,
          label: kind.name,
          children: this.projectList
            .filter(project => project.parentID == kind.id)
            .map(m => {
              return { value: m.id, label: m.name }
            })
        }
      })
      console.log(this.kindProjectOption)
    },
    getFormData() {
      let assignItem = this.assignItem
      this.order = this.$algorithm.data.orderObj[assignItem.orderID]
      if (!this.order) {
        return {}
      }
      this.projectItem = this.order.orderInfo.find(
        x => x.assignItemID == assignItem.id
      )
      if (!this.projectItem) {
        return {}
      }
      this.tech = this.data.technicianList.find(x => x.id == assignItem.techID)
      if (!this.tech) {
        return {}
      }

      const form = {}
      form.techName = assignItem.techName
      form.orderName = assignItem.orderName
      form.timeStart = assignItem.timeStart
      form.timeEnd = assignItem.timeEnd
      form.kindProjectArray = [
        this.projectItem.kind.id,
        this.projectItem.project.id
      ]
      form.additionArray = this.projectItem.additions.map(m => m.id)
      this.setAdditionOption([
        this.projectItem.kind.id,
        this.projectItem.project.id
      ])
      return form
    },
    save() {
      this.$refs['formData'].validate(valid => {
        console.log(valid)
        console.log(this.formData)
        if (!valid) return false
        // return true
        const tech = this.tech
        const order = this.order
        const projectItem = this.projectItem
        const { kind, project, additions } = this.getProjectItem()
        // 修改项目 data.orderObj
        projectItem.kind = kind
        projectItem.project = project
        projectItem.additions = additions
        // 计算价钱和技师提成
        const accountAndCommission = this.$algorithm.getAccountAndCommission({
          tech,
          projectItem
        })
        // data.assignList
        this.assignItem.accountAndCommission = accountAndCommission
        this.assignItem.orderRule = projectItem.kind.orderRule
        this.assignItem.projectName = projectItem.project.name
        this.assignItem.projectID = projectItem.project.id
        this.assignItem.workingTableID = projectItem.project.workingTableID
        this.assignItem.fixedTable =
          tech.fixedTableList &&
          tech.fixedTableList.includes(projectItem.project.workingTableID)

        this.assignItem.timeStart = this.getTime(this.formData.timeStart)
        this.assignItem.timeEnd = this.getTime(this.formData.timeEnd)
        this.assignItem.timeStartStr = this.$algorithm.getTimeStr(
          this.assignItem.timeStart
        )
        this.assignItem.timeEndStr = this.$algorithm.getTimeStr(
          this.assignItem.timeEnd
        )
        this.assignItem.duration = this.getDuration({ tech, projectItem })
        // data.positionObj
        let projects = order.orderInfo.map(x => x.project.name).join('|')
        order.timePositions.forEach(i => {
          let positionItem = this.data.positionObj[i.position]
          if (positionItem) {
            positionItem.projects = projects
          }
        })
        // 更改技师最后完成时间
        this.$algorithm.setTechLastClock(this.assignItem)
        this.$algorithm.assign()
        this.$algorithm.saveScheduleData()
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
      let projectItem = this.getProjectItem()
      // let assignItem = this.assignItem
      // let order = this.data.orderObj[assignItem.orderID]
      // if (!order) {
      //   return
      // }
      // let projectItem = order.orderInfo.find(
      //   x => x.assignItemID == assignItem.id
      // )
      // if (!projectItem) {
      //   return
      // }

      if (this.tech && this.formData.timeStart) {
        const duration = this.getDuration({ tech: this.tech, projectItem })
        this.formData.timeEnd = new Date(
          this.formData.timeStart.getTime() + duration * 60 * 1000
        )
      }
    },
    getProjectItem() {
      // let assignItem = this.assignItem
      let order = this.order
      if (!order) {
        return false
      }
      let projectItem = this.projectItem
      if (!projectItem) {
        return false
      }
      // console.log(this.formData.kindProjectArray, this.formData.additionArray)
      let kind = this.kindList.find(
        x => x.id == this.formData.kindProjectArray[0]
      )
      let project = this.projectList.find(
        x => x.id == this.formData.kindProjectArray[1]
      )
      let additions = this.additionList.filter(f =>
        this.formData.additionArray.includes(f.id)
      )
      // console.log({ kind, project, additions })
      return { kind, project, additions }
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
    }
  },
  computed: {},
  watch: {
    visible(val) {
      this.dialogVisible = val
    },
    dialogVisible(val) {
      if (val) {
        console.log(this.assignItem)
        this.formData = this.getFormData()
      }
      this.$emit('update:visible', val)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.plain-text {
  width: 68px;
  text-align: right;
  padding: 0 12px 0 0;
  float: left;
}
</style>
