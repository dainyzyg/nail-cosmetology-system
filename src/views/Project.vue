<template lang="pug">
  .page.col
    .breadcrumb-wraper
      el-breadcrumb
        el-breadcrumb-item(@click.native="setLevel({level:0,parentID:null})") 种类
        el-breadcrumb-item(@click.native="setLevel(item)" v-for="item in breadcrumbData" :key="item.id") {{item.name}}
      el-button(@click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 添加
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)" cell-class-name="table-cell")
        el-table-column(prop="name" label="名称")
          template(slot-scope='scope')
            el-button(type="text" @click="getChildren(scope.row)") {{scope.row.name}}
        el-table-column(prop="englishName" label="英文名称")
        el-table-column(v-if="level>0" align="center" prop="price" label="金额($)" width="180")
        el-table-column(v-if="level==2" align="center" prop="ask" label="必问" width="100")
          template(slot-scope='scope')
            span {{scope.row.ask?'是':'否'}}
        el-table-column(v-if="level==0" align="center" prop="priority" label="优先级" width="180")
        el-table-column(v-if="level==0" align="center" prop="orderRule" label="排钟规则" width="180")
        el-table-column(align="center" label="操作" width="180")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='remove(scope.row.id)' size='small' type='danger') 删除
        //- el-table-column(align="center" label="排序" width="180")
        //-   template(slot-scope='scope')
        //-     i.draghandle(class="el-icon-rank")
    el-dialog(title='新增' :visible.sync='addVisible')
      el-form(:inline="true" label-width="80px")
        el-form-item(label='名称')
          el-input(auto-complete='off' v-model="formData.name")
        el-form-item(label='英文名称')
          el-input(auto-complete='off' v-model="formData.englishName")
        el-form-item(label='金额($)' v-if="level>0")
          el-input-number(:controls="false" v-model="formData.price")
        el-form-item(label='必问' v-if="level==2")
          el-switch(v-model="formData.ask")
        el-form-item(label='优先级' v-if="level==0")
          el-input-number(v-model="formData.priority")
        el-form-item(label='排钟规则' v-if="level==0")
          el-radio-group(v-model="formData.orderRule" size="medium")
            el-radio-button(label="由前到后") 由前到后
            el-radio-button(label="由后到前") 由后到前
      .dialog-footer(slot='footer')
        el-button(@click="addVisible=false") 取 消
        el-button(type='primary' @click="save") 确 定

</template>
<script>
import Sortable from 'sortablejs'

export default {
  data() {
    return {
      parentID: null,
      breadcrumbData: [],
      level: 0,
      stores: ['kind', 'project', 'addition'],
      formData: {},
      addVisible: false,
      tableData: []
    }
  },
  created() {
    this.getData()
    this.$nextTick(() => {
      this.setSort()
    })
  },
  methods: {
    setLevel(data) {
      if (data.level == this.level) return
      console.log(data)
      this.level = data.level
      this.parentID = data.id
      const breadcrumbData = []
      for (let i = 0; i < data.level; i++) {
        breadcrumbData.push(this.breadcrumbData[i])
      }
      this.breadcrumbData = breadcrumbData
      this.getData()
    },
    async getChildren(data) {
      if (this.level > 1) return
      this.level += 1
      data.level = this.level
      this.breadcrumbData.push(data)
      this.parentID = data.id
      this.getData()
    },
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction(this.stores, 'readonly', t => {
        const store = t.objectStore(this.stores[this.level])
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            if (this.parentID && this.parentID == cursor.value.parentID) {
              this.tableData.push(cursor.value)
            } else if (!this.parentID) {
              this.tableData.push(cursor.value)
            }
            cursor.continue()
          }
        }
      })
    },
    async save() {
      try {
        if (!this.formData.name) {
          this.$alert('请输入名称！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (!this.formData.id) {
          this.formData.id = this.getNewID()
          if (this.parentID) {
            this.formData.parentID = this.parentID
          }
          await this.$IDB.add(this.stores[this.level], this.formData)
        } else {
          await this.$IDB.put(this.stores[this.level], this.formData)
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
    async edit(data) {
      this.formData = JSON.parse(JSON.stringify(data))
      this.addVisible = true
    },
    async remove(id) {
      await this.$IDB.delete(this.stores[this.level], id)
      this.getData()
      console.log(id, this.stores[this.level])
    },
    setSort() {
      const el = document.querySelectorAll('.el-table__body-wrapper > table > tbody')[0]
      this.sortable = Sortable.create(el, {
        handle: '.draghandle',
        dragClass: 'sortable-drag',
        ghostClass: 'sortable-ghost',
        setData: function(dataTransfer) {
          dataTransfer.setData('Text', '')
          // to avoid Firefox bug
          // Detail see : https://github.com/RubaXa/Sortable/issues/1012
        },
        onEnd: evt => {
          // const targetRow = this.tableData.splice(evt.oldIndex, 1)[0]
          // this.tableData.splice(evt.newIndex, 0, targetRow)
        }
      })
    },
    add() {
      this.formData = {}
      if (this.level == 0) {
        this.formData = { orderRule: '由前到后' }
      }
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
