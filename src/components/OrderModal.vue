<template lang="pug">
 el-dialog(:title='title' :visible.sync='dialogVisible' width="96vw" top="2vh" style="overflow:hidden;")
  .dialog-body.flex-c
    el-form(:inline="true" label-width="80px")
      el-form-item(label='名称')
        el-input(auto-complete='off' v-model="data.name")
      el-form-item(label='电话')
        el-input(auto-complete='off' v-model="data.phone")
      el-form-item(label='地址')
        el-input(auto-complete='off' v-model="data.address")
      el-form-item(label='电邮')
        el-input(auto-complete='off' v-model="data.email")
      el-form-item(label='是否到场')
        el-switch(v-model="data.isArrive")
    .project-wrapper.flex
      PanelSelect(title="种类" :data="kindList" :selectedItem.sync="selectedKind" flex="0 0 100px")
      PanelSelect(title="项目" :data="projectList" :selectedItem.sync="selectedProject" flex="0 0 150px")
      PanelSelect(title="附加" :data="additionList" :selectedItems.sync="selectedAdditions" muti flex="0 0 150px")
      PanelSelect(title="指定技师" :data="technicianList" :selectedItems.sync="selectedTechnicians" muti flex="0 0 120px")
      .btns.flex-c
        i.el-icon-circle-plus-outline(@click="addProject")
      OrderInfoPanel(title="已选项目" :data="data.orderInfo")
  .dialog-footer(slot='footer')
    el-button(@click="dialogVisible=false") 取 消
    el-button(type="danger" @click="deleteOrder" v-if="data.id") 删 除
    el-button(type='primary' @click="save") 确 定
  el-dialog(title='必问附加' :visible.sync='addAskVisible' style="overflow:hidden;" append-to-body)
    div(style="height: calc(70vh - 54px - 70px - 60px);overflow-y:auto;")
      el-form(label-width="80px")
        el-form-item(:label="i.name" v-for="i in askAddList" :key="i.id")
          el-radio-group(v-model="askResult[i.id]" size="medium")
            el-radio-button(label="do") 做
            el-radio-button(label="notdo") 不做
    .dialog-footer(slot='footer')
      el-button(@click="addAskVisible=false") 取 消
      el-button(type='primary' @click="completeAsk") 确 定
</template>

<script>
import PanelSelect from '@/components/PanelSelect'
import OrderInfoPanel from '@/components/OrderInfoPanel'

export default {
  components: {
    OrderInfoPanel,
    PanelSelect
  },
  props: {
    data: {
      default: {}
    },
    title: {
      default: ''
    },
    visible: {
      default: false
    }
  },
  created() {
    this.getKindList('technician', 'technicianList')
    this.getKindList('kind', 'kindList')
  },
  data() {
    return {
      askResult: {},
      askAddList: [],
      addAskVisible: false,
      dialogVisible: false,
      selectedKind: {},
      selectedProject: {},
      selectedAdditions: [],
      selectedTechnicians: [],
      kindList: [],
      projectList: [],
      additionList: [],
      technicianList: []
    }
  },
  methods: {
    completeAsk() {
      let isAked = true
      const newSelectAdd = []
      for (let i of this.askAddList) {
        if (this.askResult[i.id]) {
          if (this.askResult[i.id] == 'do') {
            newSelectAdd.push(i)
          }
        } else {
          isAked = false
          break
        }
      }
      if (isAked) {
        this.selectedAdditions.push(...newSelectAdd)
        const orderItem = {
          kind: this.selectedKind,
          project: this.selectedProject,
          additions: [...this.selectedAdditions],
          technicians: this.selectedTechnicians.map((item) => {
            return { id: item.id, name: item.name }
          })
        }
        this.data.orderInfo.push(orderItem)
        this.addAskVisible = false
      }
    },
    addProject() {
      if (this.data.orderInfo.find((x) => x.project.id == this.selectedProject.id)) {
        this.$alert('无法添加重复的项目！', '提示', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        return
      }
      this.askResult = {}
      this.askAddList = this.additionList.filter((a) => a.ask && !this.selectedAdditions.find((s) => s.id == a.id))
      if (this.askAddList.length > 0) {
        this.addAskVisible = true
        return
      }
      const orderItem = {
        kind: this.selectedKind,
        project: this.selectedProject,
        additions: [...this.selectedAdditions],
        technicians: this.selectedTechnicians.map((item) => {
          return { id: item.id, name: item.name }
        })
      }
      this.data.orderInfo.push(orderItem)
    },
    async getKindList(storeName, dataName) {
      await this.$IDB.executeTransaction(storeName, 'readonly', (t) => {
        const store = t.objectStore(storeName)
        const request = store.openCursor()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            this[dataName].push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    async getList(storeName, dataName, parentID) {
      this[dataName] = []
      this.$IDB.executeTransaction([storeName], 'readonly', (t) => {
        const store = t.objectStore(storeName)
        const request = store.index('parentID').openCursor(IDBKeyRange.only(parentID))
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            this[dataName].push(cursor.value)
            cursor.continue()
          }
        }
      })
    },
    save() {
      try {
        if (!this.data.name) {
          this.$alert('请输入顾客姓名！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        if (this.data.orderInfo.length <= 0) {
          this.$alert('请添加项目！', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          })
          return
        }
        this.$emit('save')
      } catch (e) {
        this.$alert(e.message, '错误提示', {
          confirmButtonText: '确定',
          type: 'error'
        })
      }
    },
    async deleteOrder() {
      const r = await this.$confirm('此操作将永久删除该订单, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      if (r != 'confirm') return
      this.$emit('delete')
    }
  },
  computed: {},
  watch: {
    selectedProject(val) {
      this.selectedAdditions = []
      this.selectedTechnicians = []
      this.getList('addition', 'additionList', val.id)
    },
    projectList(val) {
      if (val.length) {
        this.selectedProject = val[0]
      } else {
        this.additionList = []
      }
    },
    selectedKind(val) {
      this.getList('project', 'projectList', val.id)
    },
    visible(val) {
      if (val) {
        this.selectedKind = this.kindList[0]
      }
      this.dialogVisible = val
      this.tipList = []
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-body {
  height: calc(96vh - 86px - 70px - 60px);
}
.project-wrapper {
  padding-top: 10px;
  flex: 1;
  border-top: 1px solid #dcdfe6;
}
.btns {
  flex: 0 0 35px;
  margin-right: 10px;
  justify-content: center;
  align-items: center;
}
.btns i {
  font-size: 35px;
  margin: 20px 0;
  cursor: pointer;
}
</style>
