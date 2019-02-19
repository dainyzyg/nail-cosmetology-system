<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="100%")
        el-table-column(prop="minutes" label="等待时间(分钟)" align="center" header-align="center")
        el-table-column(label="金额$" prop="price" align="center" header-align="center")
        el-table-column(align="center" label="操作" width="260")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            //- span.space(v-if="scope.row.minutes!='最大时间'")
            el-button(v-if="scope.row.minutes!='最大时间'" @click='remove(scope.row.minutes)' size='small' type='danger') 删除
    el-dialog(:visible.sync='addVisible' style="overflow:hidden;")
      el-form(:inline="true" :rules="rules" :model="formData" ref="formData")
        el-form-item(v-if="isAdd" label='等待时间(分钟)' prop="minutes")
          el-input-number(auto-complete='off' v-model="formData.minutes")
          //- span(v-if="formData.minutes=='最大时间'") {{formData.minutes}}
          //- el-input(auto-complete='off' v-model="formData.minutes")
        el-form-item(v-if="!isAdd" label='等待时间(分钟)') {{formData.minutes}}
        el-form-item(label='金额$' prop="price")
          el-input-number(auto-complete='off' v-model="formData.price")
      //- el-tabs(type="border-card")
      //-   el-tab-pane(:label="item.name" :key="item.id" v-for="item in kindList")
      //-     ProjectSelect(:kind="item" :skills="skills")
      .dialog-footer(slot='footer')
        el-button(@click="addVisible=false") 取 消
        el-button(type='primary' @click="save") 确 定
</template>
<script>
export default {
  // components: {
  //   // ProjectSelect,
  //   SkillSetting
  // },
  data() {
    return {
      isAdd: true,
      rules: {
        minutes: [
          { required: true, message: '等待时间不能为空', trigger: 'blur' },
          { min: 1, type: 'number', message: '等待时间不能小于1', trigger: 'blur' }
        ],
        price: [
          { required: true, message: '金额不能为空', trigger: 'blur' },
          { min: 0, type: 'number', message: '金额不能小于0', trigger: 'blur' }
        ]
      },
      formData: {},
      addVisible: false,
      tableData: []
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      const tableData = await this.$IDB.getAll('waitingConfig')
      if (!tableData.find(x => x.minutes == '最大时间')) {
        tableData.push({
          minutes: '最大时间',
          price: null
        })
      }
      this.tableData = tableData
    },
    async save() {
      this.$refs['formData'].validate(async (valid) => {
        if (!valid) return false
        try {
          await this.$IDB.put('waitingConfig', this.formData)
          this.addVisible = false
          this.getData()
        } catch (e) {
          console.log(e)
          this.$alert('保存失败！', '错误提示', {
            confirmButtonText: '确定',
            type: 'error'
          })
        }
      })
    },
    async edit(data) {
      this.isAdd = false
      this.formData = JSON.parse(JSON.stringify(data))
      this.addVisible = true
    },
    async remove(id) {
      await this.$IDB.delete('waitingConfig', id)
      this.getData()
    },
    add() {
      this.isAdd = true
      this.formData = {}
      this.addVisible = true
    },
    getNewID() {
      const pn = performance.now()
      const time = new Date().getTime()
      const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(0, 3)
      const timeStr = `${time}${pnStr}`
      return parseInt(timeStr)
    }
  }
}
</script>
<style scoped>
.space {
  margin: 0 20px;
  background: saddlebrown;
}
.row {
  height: 50px;
  width: 400px;
  border: 1px solid #999;
}
.draghandle {
  font-size: 25px;
  font-weight: bolder;
}
.breadcrumb-wraper {
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex: 0 0 45px;
  align-items: flex-end;
  justify-content: space-between;
  /* border-bottom: 1px solid #eaeefb; */
}
.table-wraper {
  /* background-color: #fafafa;
  background-color: darkcyan; */
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-radius: 5px;
}
</style>
<style>
.table-cell {
  padding: 2px 0 !important;
}
.sortable-drag {
  background-color: red !important;
}
.sortable-ghost {
  opacity: 0.2;
  color: #909399 !important;
  background-color: #304156 !important;
}
</style>
