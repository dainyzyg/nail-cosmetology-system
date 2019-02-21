<template lang="pug">
  .page.col
    //- .breadcrumb-wraper
    //-   .title 得分基数:
    //-   el-input-number(style="width:150px;" size="medium" :min="1" v-model="rateBaseScore" @change="changeRateBaseScore")
    .table-wraper
      el-table.table(:data="tableData" border height="100%")
        el-table-column(prop="rate" label="星级" align="center" header-align="center")
          template(slot-scope='scope')
            el-rate(v-model='scope.row.rate' disabled)
        el-table-column(label="得分系数" prop="scoreCoefficient" align="center" header-align="center")
          template(slot-scope='scope')
            el-input-number(:max="100" v-model="scope.row.scoreCoefficient" @change="change(scope.row)")
        el-table-column(label="保底小费比例%" prop="bottomTipProportion" align="center" header-align="center")
          template(slot-scope='scope')
            el-input-number(:min="0" :max="100" v-model="scope.row.bottomTipProportion" @change="change(scope.row)")
</template>
<script>
export default {
  // components: {
  //   // ProjectSelect,
  //   SkillSetting
  // },
  data() {
    let tableData = []
    for (let i = 1; i <= 5; i++) {
      tableData.push({
        rate: i,
        scoreCoefficient: null,
        bottomTipProportion: null
      })
    }
    let rateBaseScore = localStorage.rateBaseScore || 0
    return {
      addVisible: false,
      rateBaseScore,
      tableData
    }
  },
  created() {
    this.getData()
  },
  methods: {
    changeRateBaseScore(val) {
      localStorage.rateBaseScore = val
    },
    change(row) {
      this.$IDB.put('rateConfig', row)
    },
    async getData() {
      const data = await this.$IDB.getAll('rateConfig')
      console.log({ data })
      this.tableData.forEach(i => {
        let item = data.find(x => x.rate == i.rate)
        if (item) {
          i.scoreCoefficient = item.scoreCoefficient
          i.bottomTipProportion = item.bottomTipProportion
        }
      })
    },
    async save() {
      this.$refs['formData'].validate(async (valid) => {
        if (!valid) return false
        try {
          await this.$IDB.put('rateConfig', this.formData)
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
.title {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
  height: 36px;
  margin-right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}
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
  /* justify-content: space-between; */
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
