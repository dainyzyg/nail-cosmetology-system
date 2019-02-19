<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(prop="type" label="台种类")
        el-table-column(align="center" label="数量" prop="count" width="200")
        el-table-column(align="center" label="操作" width="200")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='remove(scope.row.id)' size='small' type='danger') 删除
    el-dialog(:visible.sync='addVisible' style="overflow:hidden;")
      el-form(:model="formData" ref="formData" label-width="80px" style="width:260px" :rules="rules")
        el-form-item(label='台种类' prop="type")
          el-input(auto-complete='off' v-model="formData.type")
        el-form-item(label='数量' prop="count")
          el-input-number(auto-complete='off' v-model="formData.count")
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
      formData: {},
      addVisible: false,
      tableData: [],
      rules: {
        count: [
          { required: true, message: '数量不能为空', trigger: 'blur' },
          { min: 0, type: 'number', message: '数量不能小于0', trigger: 'blur' }
        ],
        type: [{ required: true, message: '台种类不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction('workingTable', 'readonly', (t) => {
        const store = t.objectStore('workingTable')
        const request = store.getAll()
        request.onsuccess = (event) => {
          const result = event.target.result
          if (result) {
            this.tableData = result
          }
        }
      })
    },
    async save() {
      console.log(this.formData)
      this.formData.id = this.formData.id || this.getNewID()
      this.$refs['formData'].validate(async (valid) => {
        if (!valid) return false
        await this.$IDB.put('workingTable', this.formData)
        this.addVisible = false
        this.getData()
        this.$algorithm.initData()
      })
    },
    async edit(data) {
      this.formData = JSON.parse(JSON.stringify(data))
      this.addVisible = true
    },
    async remove(id) {
      const r = await this.$confirm('此操作将永久删除该条记录, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      if (r != 'confirm') return
      await this.$IDB.delete('workingTable', id)
      this.getData()
      this.$algorithm.initData()
    },
    add() {
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
  flex: 0 0 50px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eaeefb;
}
.table-wraper {
  background-color: #fafafa;
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
