<template lang="pug">
  el-popover(placement="right" v-model="visible")
    //- el-button(size="medium" type="text" @click="popVisible = false") 取消
    el-button(v-if="['waiting','advance'].includes(assignItem.status)" type="primary" size="medium" @click="unshiftToAssignList(assignItem,'fix')") 固定
    el-button(v-if="['waiting','advance'].includes(assignItem.status)" type="success" size="medium" @click="unshiftToAssignList(assignItem,'start')") 开始
    el-button(v-if="assignItem.status=='start'||assignItem.status=='fix'" type="danger" size="medium" @click="cancelAssign") 取消
    el-button(v-if="assignItem.status=='fix'" type="success" size="medium" @click="startProject") 开始
    el-button(v-if="assignItem.status=='start'" type="warning" size="medium" @click="endProject") 结束
    el-button(v-if="['start','fix'].includes(assignItem.status)" type="info" size="medium" @click="modifyProject") 修改
    .assign-btn(slot="reference" :style="{backgroundColor}" :type="getAssignItemType()" size="medium" plain)
      .btn-line
        | {{assignItem.techName}}
        i.el-icon-caret-right
        | {{getPosition(assignItem)}}
        | /
        | {{assignItem.orderName}}
      .divider
      .btn-line {{assignItem.number+'/'+assignItem.count+' '+assignItem.projectName+' '+formatTime(assignItem.timeStartStr)+'-'+formatTime(assignItem.timeEndStr)}}
      template(v-if="$attrs.assign && getUndoProjects()")
        .divider
        .btn-line 未做项目:{{getUndoProjects()}}
</template>

<script>
export default {
  props: ['assignItem', 'activeAssignTab', 'index'],
  created() {},
  data() {
    return {
      visible: false
    }
  },
  methods: {
    getUndoProjects() {
      let order = this.$algorithm.data.orderObj[this.assignItem.orderID]
      if (order) {
        return order.orderInfo
          .filter(f => !f.assignItemID)
          .map(m => m.project.name)
          .join(' ')
      }
      return ''
    },
    getPosition(assignItem) {
      let order = this.$algorithm.data.orderObj[assignItem.orderID]
      if (order && order.timePositions.length >= assignItem.number) {
        let time = order.timePositions[assignItem.number - 1].time
        let index = order.timePositions[assignItem.number - 1].index
        let position = time.toLocaleTimeString('en').replace(/:00 [AP]M$/, '')
        return `${position}-${index}`
      }
      return ''
    },
    formatTime(str, hasMeridiem) {
      if (!str) return ''
      let meridiem = 'AM'
      const array = str.split(':')
      let hours = parseInt(array[0])
      const minutes = array[1]
      if (hours >= 12) {
        meridiem = 'PM'
        if (hours > 12) {
          hours -= 12
        }
      } else if (hours == 0) {
        hours = 12
      }
      return `${hours}:${minutes}${hasMeridiem ? meridiem : ''}`
    },
    getAssignItemType() {
      if (this.assignItem.status == 'fix') {
        return 'primary'
      } else if (this.assignItem.status == 'end') {
        return 'warning'
      }
      return 'success'
    },
    endProject() {
      this.$algorithm.endAssignItem(this.assignItem)
      this.visible = false
    },
    startProject() {
      this.$algorithm.startAssignItem(this.assignItem)
      this.visible = false
    },
    cancelAssign() {
      this.$algorithm.cancelAssignItem(this.assignItem, this.index)
      this.visible = false
    },
    unshiftToAssignList(assignItem, status) {
      this.$algorithm.unshiftToAssignList(assignItem, status, this.index)
      this.visible = false
    },
    modifyProject() {
      console.log('modify-assign')
      this.$emit('modifyAssign', this.assignItem)
    }
  },
  computed: {
    backgroundColor() {
      switch (this.assignItem.status) {
        case 'fix':
          return '#13c2c2'
        case 'start':
          return '#f5222d'
        case 'end':
          return '#fadb14'
        case 'waiting':
          return '#52c41a'
        case 'advance':
          return '#1890ff'
      }
      return '#8c8c8c'
    }
  },
  watch: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.divider {
  height: 6px;
}
.assign-btn {
  cursor: pointer;
  margin-top: 1px;
  flex: 1;
  padding: 7px 6px;
  /* border-radius: 4px; */
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  color: #ffffff;
  overflow: hidden;
}
.assign-btn:hover {
  opacity: 0.8;
}
.btn-line {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
