<template>
  <div class="page col">
    <div class="title">数据还原</div>
    <div class="list-wrapper">
      <div class="list">
        <div
          class="list-item"
          v-for="i in list"
          :key="i.fileName"
          @click="restore(i)"
        >
          <div>{{ i.fileName }}</div>
          <div class="backup">还原</div>
        </div>
      </div>
    </div>
    <v-dialog class="dialog" />
  </div>
</template>
<script>
const fs = window.fs
const path = window.path
const backupDir = window.backupDir
const dbDir = window.dbDir

export default {
  data() {
    return {
      list: []
    }
  },
  mounted() {},
  created() {
    this.getBackupList()
  },
  beforeDestroy() {},
  methods: {
    desc(a, b) {
      if (a.fileName < b.fileName) {
        // 按某种排序标准进行比较, a 小于 b
        return 1
      }
      if (a.fileName > b.fileName) {
        return -1
      }
      // a must be equal to b
      return 0
    },
    asc(a, b) {
      if (a.fileName < b.fileName) {
        // 按某种排序标准进行比较, a 小于 b
        return -1
      }
      if (a.fileName > b.fileName) {
        return 1
      }
      // a must be equal to b
      return 0
    },
    getBackupList() {
      try {
        let list = []
        fs.readdirSync(backupDir).forEach(item => {
          let filePath = path.join(backupDir, item)
          let fileName = item
          let state = fs.statSync(filePath)
          if (state.isDirectory()) {
            list.push({ filePath, fileName })
          }
        })
        this.list = list.sort(this.desc)
      } catch (e) {
        console.error(e)
      }
    },
    restore(file) {
      this.$modal.show('dialog', {
        title: '确定还原此备份数据？',
        text: `还原数据至：${file.fileName}`,
        buttons: [
          {
            title: '取消',
            handler: () => {
              this.$modal.hide('dialog')
            }
          },
          {
            title: '确定',
            handler: () => {
              this.doRestore(file)
            }
          }
        ]
      })
    },
    doRestore(file) {
      console.log(file)
      this.$modal.hide('dialog')
      this.deleteDir(dbDir)
      this.copyDir(file.filePath, dbDir)
      setTimeout(() => {
        this.$modal.show('dialog', {
          text: ' 数据还原完毕！',
          buttons: [
            {
              title: '确定',
              handler: () => {
                this.$modal.hide('dialog')
              }
            }
          ]
        })
      }, 500)
    },
    deleteDir(dir) {
      if (fs.existsSync(dir) == true) {
        let files = fs.readdirSync(dir)
        files.forEach(item => {
          let itemPath = path.join(dir, item)
          // console.log(itemPath);
          if (fs.statSync(itemPath).isDirectory()) {
            this.deleteDir(itemPath)
          } else {
            fs.unlinkSync(itemPath)
          }
        })
        fs.rmdirSync(dir)
      } else {
        console.log(`can't find dir:${dir}`)
      }
    },
    copyDir(src, dest) {
      this.tryMkdir(dest)
      if (fs.existsSync(src) == false) {
        return false
      }
      // console.log("src:" + src + ", dest:" + dest);
      // 拷贝新的内容进去
      const dirs = fs.readdirSync(src)
      dirs.forEach(item => {
        let itemPath = path.join(src, item)
        let temp = fs.statSync(itemPath)
        if (temp.isFile()) {
          // 是文件
          // console.log("Item Is File:" + item);
          fs.copyFileSync(itemPath, path.join(dest, item))
        } else if (temp.isDirectory()) {
          // 是目录
          // console.log("Item Is Directory:" + item);
          this.copyDir(itemPath, path.join(dest, item))
        }
      })
    },
    tryMkdir(dest) {
      try {
        fs.mkdirSync(dest)
      } catch (e) {
        console.error(e)
        console.log(`dir:${dest} has already exists`)
      }
    },
    show() {
      this.$modal.show('my-first-modal')
    },
    hide() {
      this.$modal.hide('my-first-modal')
    }
  },
  computed: {},
  watch: {}
}
</script>
<style scoped>
.page {
  background: #bbe6d6;
  color: #2c3e50;
}
.title {
  padding: 16px;
  padding-left: 30px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  flex: 0 0 32px;
  z-index: 1;
  background: #bbe6d6;

  font-size: 18px;
  font-weight: bold;
}
.list-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 10px;
  /* background: saddlebrown; */
}
.list {
  flex: 1;
  max-width: 800px;
  /* margin: auto; */
  border-radius: 6px;
  background: #e4f5ef;
  padding: 10px;
  overflow: auto;
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #2c3e50;
  font-size: 18px;
  height: 40px;
  padding: 5px;
  font-weight: 700;
}
.list-item:hover {
  background: #bbe6d6;
}
.dialog {
  color: #6b7c93;
  word-break: break-all;
}
.backup {
  color: #42b983;
  cursor: pointer;
}
</style>
