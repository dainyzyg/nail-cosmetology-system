<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(prop="name" label="姓名" width="300")
        el-table-column(label="固定台")
          template(slot-scope="scope")
            el-tag(style="margin-right:10px;" v-if="i" :key="i" v-for="i in getFixedTableName(scope.row.fixedTableList)") {{i}}
        el-table-column(align="center" label="操作" width="300")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='skillSetting(scope.row)' size='small' type="primary") 技能设置
            el-button(@click='remove(scope.row.id)' size='small' type='danger') 删除
    el-dialog(title='技师信息' :visible.sync='addVisible' style="overflow:hidden;")
      el-form(:inline="true" label-width="100px")
        el-form-item(label='姓名')
          el-input(auto-complete='off' v-model="formData.name")
        el-form-item(label='密码')
          el-input(auto-complete='off' v-model="formData.password")
        el-form-item(label='固定台')
          el-select(v-model="formData.fixedTableList" multiple placeholder="请选择")
            el-option(v-for="item in workingTableList" :key="item.id" :label="item.type" :value="item.id")
        el-form-item(label='序号')
          el-input-number(v-model="formData.index" style="width:184px")
        el-form-item(label='目标分数')
          el-input-number(v-model="formData.targetScore" style="width:184px")
        el-form-item(label='目标级别')
          el-input(auto-complete='off' v-model="formData.targetLevel" style="width:202px")
        el-form-item(label='实际得分')
          el-input-number(v-model="formData.score" style="width:184px")
      .dialog-footer(slot='footer')
        el-button(@click="addVisible=false") 取 消
        el-button(type='primary' @click="save") 确 定
    SkillSetting(v-model="skillSettingVisible" :technician="technician")

</template>
<script>
// import ProjectSelect from '@/components/ProjectSelect'
import SkillSetting from '@/components/SkillSetting'
export default {
  components: {
    // ProjectSelect,
    SkillSetting
  },
  data() {
    return {
      technician: {},
      skillSettingVisible: false,
      skills: {},
      kindList: [],
      formData: { fixedTableList: [] },
      addVisible: false,
      tableData: [],
      workingTableList: []
    }
  },
  created() {
    this.getWorkingTable()
    this.getKindList()
    this.getData()
  },
  methods: {
    getFixedTableName(fixedTableList) {
      return fixedTableList.map(x => {
        let item = this.workingTableList.find(y => y.id == x)
        if (item) return item.type
        return ''
      })
    },
    async getWorkingTable() {
      await this.$IDB.executeTransaction('workingTable', 'readonly', t => {
        const store = t.objectStore('workingTable')
        const request = store.getAll()
        request.onsuccess = event => {
          const result = event.target.result
          if (result) {
            this.workingTableList = result
          }
        }
      })
    },
    async getKindList() {
      await this.$IDB.executeTransaction(['kind'], 'readonly', t => {
        const store = t.objectStore('kind')
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this.kindList.push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    async getData() {
      let tableData = []
      await this.$IDB.executeTransaction('technician', 'readonly', t => {
        const store = t.objectStore('technician')
        const request = store.index('index').openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            cursor.value.fixedTableList = cursor.value.fixedTableList || []
            tableData.push(cursor.value)
            cursor.continue()
          }
        }
      })
      this.tableData = tableData
    },
    async save() {
      this.formData.index = this.formData.index || 0
      try {
        if (!this.formData.name) {
          this.$alert('请输入姓名！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (!this.formData.id) {
          const id = this.getNewID()
          this.formData.id = id
          this.formData.skillInfo = {}
          await this.$IDB.add('technician', this.formData)
        } else {
          await this.$IDB.put('technician', this.formData)
        }
        this.addVisible = false
        this.getData()
      } catch (e) {
        let errMessage = e.message
        if (
          !errMessage &&
          e.target &&
          e.target.error &&
          e.target.error.message
        ) {
          errMessage = e.target.error.message
        }
        this.$alert(errMessage, '错误提示', {
          confirmButtonText: '确定',
          type: 'error'
        })
      }
      this.$algorithm.initData()
    },
    skillSetting(data) {
      this.technician = data
      this.technician.skillInfo = this.technician.skillInfo || {}
      this.skillSettingVisible = true
    },
    async edit(data) {
      this.formData = JSON.parse(JSON.stringify(data))
      this.skills = JSON.parse(JSON.stringify(data.skillInfo || {}))
      this.addVisible = true
    },
    async remove(id) {
      const r = await this.$confirm(
        '此操作将永久删除该条记录, 是否继续?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      if (r != 'confirm') return
      await this.$IDB.delete('technician', id)
      this.getData()
      this.$algorithm.initData()
    },
    add() {
      this.formData = { fixedTableList: [] }
      this.skills = {}
      this.addVisible = true
    },
    getNewID() {
      const pn = performance.now()
      const time = new Date().getTime()
      const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(
        0,
        3
      )
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
