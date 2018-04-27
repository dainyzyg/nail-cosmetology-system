<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(prop="percentage" label="百分比(%)" width="200")
        el-table-column(label="描述" prop="description")
        el-table-column(align="center" label="操作" width="200")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='remove(scope.row.percentage)' size='small' type='danger') 删除
    el-dialog(title='新增技师' :visible.sync='addVisible' style="overflow:hidden;")
      el-form(label-width="80px")
        el-form-item(label='百分比(%)')
          el-input-number(auto-complete='off' v-model="formData.percentage")
        el-form-item(label='描述')
          el-input(auto-complete='off' v-model="formData.description")
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
      tableData: []
    }
  },
  created() {
    this.getData()
  },
  methods: {
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction('feeInfo', 'readonly', t => {
        const store = t.objectStore('feeInfo')
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this.tableData.push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    async save() {
      try {
        if (!this.formData.percentage) {
          this.$alert('请输入百分比！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        await this.$IDB.put('feeInfo', this.formData)
        this.addVisible = false
        this.getData()
      } catch (e) {
        this.$alert(e.message, '错误提示', {
          confirmButtonText: '确定',
          type: 'error'
        })
      }
    },
    skillSetting(data) {
      this.technician = data
      this.technician.skillInfo = this.technician.skillInfo || {}
      this.skillSettingVisible = true
    },
    async edit(data) {
      this.formData = JSON.parse(JSON.stringify(data))
      this.addVisible = true
    },
    async remove(id) {
      await this.$IDB.delete('feeInfo', id)
      this.getData()
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
