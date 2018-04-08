<template lang="pug">
  .page.col
    .breadcrumb-wraper
      .placeholder
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(prop="name" label="姓名")
        el-table-column(align="center" label="操作" width="250")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='skillSetting(scope.row)' size='small' type="primary") 技能设置
            el-button(@click='remove(scope.row.id)' size='small' type='danger') 删除
    el-dialog(title='新增技师' :visible.sync='addVisible' style="overflow:hidden;")
      el-form(:inline="true" label-width="80px")
        el-form-item(label='姓名')
          el-input(auto-complete='off' v-model="formData.name")
        el-form-item(label='密码')
          el-input(auto-complete='off' v-model="formData.password")
        el-form-item(label='序号')
          el-input-number(auto-complete='off' v-model="formData.index")
      //- el-tabs(type="border-card")
      //-   el-tab-pane(:label="item.name" :key="item.id" v-for="item in kindList")
      //-     ProjectSelect(:kind="item" :skills="skills")
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
      formData: {},
      addVisible: false,
      tableData: []
    }
  },
  created() {
    this.getKindList()
    this.getData()
    // this.$nextTick(() => {
    //   this.setSort()
    // })
  },
  methods: {
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
      this.tableData = []
      await this.$IDB.executeTransaction('technician', 'readonly', t => {
        const store = t.objectStore('technician')
        const request = store.index('index').openCursor()
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
      this.skills = JSON.parse(JSON.stringify(data.skillInfo || {}))
      this.addVisible = true
    },
    async remove(id) {
      await this.$IDB.delete('technician', id)
      this.getData()
    },
    add() {
      this.formData = {}
      this.skills = {}
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
