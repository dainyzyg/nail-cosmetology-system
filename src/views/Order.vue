<template lang="pug">
  .page.col
    .breadcrumb-wraper
      el-date-picker(v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" size="large")
      el-button(style="margin-left:10px;" @click="add" icon="el-icon-circle-plus-outline" size="medium" type="primary") 新增订单
    .table-wraper
      el-table.table(:data="tableData" border height="calc(100vh - 66px)")
        el-table-column(prop="name" label="姓名")
        el-table-column(prop="phone" label="电话")
        el-table-column(prop="orderInfo" :formatter="orderInfoFormatter" label="项目")
        el-table-column(prop="orderDate" :formatter="timeFormatter" label="订单时间" align="center" header-align="center" width="120")
        el-table-column(prop="isPreorder" label="预约" align="center" header-align="center" width="120")
          template(slot-scope='scope')
            span {{scope.row.isPreorder?scope.row.preorderTime.toLocaleTimeString('en-GB'):'无'}}
        el-table-column(align="center" label="操作" width="180")
          template(slot-scope='scope')
            el-button(@click='edit(scope.row)' size='small' type="primary") 编辑
            el-button(@click='remove(scope.row.id)' size='small' type='danger') 删除
    el-dialog(title='新增' :visible.sync='addVisible' width="96vw" top="2vh" style="overflow:hidden;")
      .dialog-body.flex-c
        el-form(:inline="true" label-width="80px")
          el-form-item(label='名称')
            el-input(auto-complete='off' v-model="formData.name")
          el-form-item(label='电话')
            el-input(auto-complete='off' v-model="formData.phone")
          el-form-item(label='地址')
            el-input(auto-complete='off' v-model="formData.address")
          el-form-item(label='电邮')
            el-input(auto-complete='off' v-model="formData.email")
          el-form-item(label='下单时间')
            el-time-picker(@focus="focus" style="margin-left:10px;" v-model="formData.orderDate" placeholder="下单时间")
          el-form-item(label='预约')
            el-switch(v-model="formData.isPreorder")
            el-time-picker(:default-value="workBegin" v-if="formData.isPreorder" style="margin-left:10px;" v-model="formData.preorderTime" placeholder="预约时间")
        .project-wrapper.flex
          PanelSelect(title="种类" :data="kindList" :selectedItem.sync="selectedKind" flex="0 0 100px")
          PanelSelect(title="项目" :data="projectList" :selectedItem.sync="selectedProject" flex="0 0 150px")
          PanelSelect(title="附加" :data="additionList" :selectedItems.sync="selectedAdditions" muti flex="0 0 150px")
          PanelSelect(title="指定技师" :data="technicianList" :selectedItems.sync="selectedTechnicians" muti flex="0 0 120px")
          .btns.flex-c
            i.el-icon-circle-plus-outline(@click="addProject")
          OrderInfoPanel(title="已选项目" :data="orderInfo")
      .dialog-footer(slot='footer')
        el-button(@click="addVisible=false") 取 消
        el-button(type='primary' @click="save") 确 定
</template>
<script>
import PanelSelect from '@/components/PanelSelect'
import OrderInfoPanel from '@/components/OrderInfoPanel'

export default {
  components: {
    PanelSelect,
    OrderInfoPanel
  },
  data() {
    return {
      addVisible: false,
      orderTime: new Date('2018/2/27'),
      dataTime: new Date('2018/2/27'),
      tableData: [],
      formData: {},
      selectedKind: {},
      selectedProject: {},
      selectedAdditions: [],
      selectedTechnicians: [],
      kindList: [],
      projectList: [],
      additionList: [],
      technicianList: [],
      orderInfo: []
    }
  },
  created() {
    this.getData()
    this.getKindList('technician', 'technicianList')
    this.getKindList('kind', 'kindList')
  },
  methods: {
    focus() {
      // clearInterval(this.st)
    },
    async edit(data) {
      this.formData = JSON.parse(JSON.stringify(data), (k, v) => {
        if (typeof v == 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i.test(v)) {
          return new Date(v)
        }
        return v
      })
      console.log(this.formData)
      this.orderInfo = this.formData.orderInfo
      this.addVisible = true
    },
    async remove(id) {
      await this.$IDB.delete('order', id)
      this.getData()
    },
    orderInfoFormatter(row, column, cell) {
      if (cell) {
        const projectList = []
        for (let item of cell) {
          projectList.push(item.project.name)
        }
        return projectList.join(',')
      }
      return ''
    },
    timeFormatter(row, column, cell) {
      if (cell) {
        return cell.toLocaleTimeString('en-GB')
      }
      return ''
    },
    async save() {
      try {
        if (!this.formData.name) {
          this.$alert('请输入顾客姓名！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (this.formData.isPreorder && !this.formData.preorderTime) {
          this.$alert('请输入预约时间！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (this.orderInfo.length <= 0) {
          this.$alert('请添加项目！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (!this.formData.id) {
          this.formData.id = this.getNewID()
          // this.formData.orderDate = new Date()
          this.formData.orderInfo = this.orderInfo
          if (!this.formData.isPreorder) {
            this.formData.preorderTime = this.formData.orderDate
          }
          await this.$IDB.add('order', this.formData)
        } else {
          this.formData.orderInfo = this.orderInfo
          if (!this.formData.isPreorder) {
            this.formData.preorderTime = this.formData.orderDate
          }
          await this.$IDB.put('order', this.formData)
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
    addProject() {
      const orderItem = {
        kind: this.selectedKind,
        project: this.selectedProject,
        additions: this.selectedAdditions,
        technicians: this.selectedTechnicians.map(item => {
          return { id: item.id, name: item.name }
        })
      }
      this.orderInfo.push(orderItem)
    },
    add() {
      if (this.kindList.length) {
        this.selectedKind = {}
        this.selectedKind = this.kindList[0]
      }
      this.selectedTechnicians = []
      this.orderInfo = []
      this.formData = {}

      const dateNow = new Date()
      console.log(dateNow)
      this.orderTime.setHours(dateNow.getHours(), dateNow.getMinutes(), dateNow.getSeconds())
      const orderDate = new Date(this.orderTime.getTime())
      this.formData = { orderDate }
      console.log(this.orderTime)
      this.addVisible = true
    },
    async getList(storeName, dataName, parentID) {
      this[dataName] = []
      this.$IDB.executeTransaction([storeName], 'readonly', t => {
        const store = t.objectStore(storeName)
        const request = store.index('parentID').openCursor(IDBKeyRange.only(parentID))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this[dataName].push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    async getKindList(storeName, dataName) {
      await this.$IDB.executeTransaction(storeName, 'readonly', t => {
        const store = t.objectStore(storeName)
        const request = store.openCursor()
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this[dataName].push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    async getData() {
      this.tableData = []
      await this.$IDB.executeTransaction(['order'], 'readonly', t => {
        const store = t.objectStore('order')
        const request = store.index('orderDate').openCursor(IDBKeyRange.bound(this.dateBegin, this.dateEnd))
        request.onsuccess = event => {
          const cursor = event.target.result
          if (cursor) {
            this.tableData.push(cursor.value)
            cursor.continue()
          }
        }
      })
      if (this.projectList.length > 0) {
        this.selectProject = this.projectList[0]
      }
    },
    getNewID() {
      const pn = performance.now()
      const time = new Date().getTime()
      const pnStr = `${pn.toString().replace(/\d+\.(\d*)/, '$1')}000`.substr(0, 3)
      const timeStr = `${time}${pnStr}`
      return parseInt(timeStr)
    }
  },
  watch: {
    dataTime(val) {
      this.getData()
    },
    kindList(val) {
      if (val.length) {
        this.selectedKind = val[0]
      }
    },
    projectList(val) {
      if (val.length) {
        this.selectedProject = val[0]
      } else {
        this.additionList = []
      }
    },
    selectedProject(val) {
      this.selectedAdditions = []
      this.selectedTechnicians = []
      this.getList('addition', 'additionList', val.id)
    },
    selectedKind(val) {
      this.getList('project', 'projectList', val.id)
    }
  },
  computed: {
    dateBegin() {
      return new Date(this.dataTime.toDateString())
    },
    workBegin() {
      return new Date(this.dateBegin.getTime() + 11 * 60 * 60 * 1000)
    },
    dateEnd() {
      return new Date(this.dateBegin.getTime() + 24 * 60 * 60 * 1000 - 1)
    }
  }
}
</script>
<style scoped>
.btns i {
  font-size: 35px;
  margin: 20px 0;
  cursor: pointer;
}
.btns {
  flex: 0 0 35px;
  margin-right: 10px;
  justify-content: center;
  align-items: center;
}
.project-wrapper {
  padding-top: 10px;
  flex: 1;
  border-top: 1px solid #dcdfe6;
}
.dialog-body {
  height: calc(96vh - 54px - 70px - 60px);
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
  flex: 0 0 50px;
  align-items: center;
  justify-content: flex-end;
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
</style>
