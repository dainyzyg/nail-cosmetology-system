const fs = require('fs')
const path = require('path')

// 备份防抖间隔
const IntervalTime = 20000
// 备份文件夹最大数量
const maxCount = 100

let dir = path.resolve(
  process.cwd(),
  './userData/IndexedDB/atom_atom_0.indexeddb.leveldb'
)
let backupDir = path.resolve(process.cwd(), './backup')

const debounce = (func, wait) => {
  console.log('create debounce')
  let timer
  return () => {
    console.log({ timer })
    clearTimeout(timer)
    timer = setTimeout(func, wait)
  }
}

const file = {
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
    let list = []
    try {
      fs.readdirSync(backupDir).forEach(item => {
        let filePath = path.join(backupDir, item)
        let fileName = item
        let state = fs.statSync(filePath)
        if (state.isDirectory()) {
          list.push({ filePath, fileName })
        }
      })
    } catch (e) {
      console.error(e)
    }
    return list.sort(this.asc)
  },
  removeRedundantBackup() {
    const list = this.getBackupList()
    if (list.length >= maxCount) {
      for (let i = 0; i < list.length - maxCount + 1; i++) {
        this.DeleteDirectory(list[i].filePath)
      }
    }
  },
  tryMkdir(dest) {
    try {
      fs.mkdirSync(dest)
    } catch (e) {
      console.error(e)
      console.log(`dir:${dest} has already exists`)
    }
  },
  CopyDirectory(src, dest) {
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
        this.CopyDirectory(itemPath, path.join(dest, item))
      }
    })
  },
  DeleteDirectory(dir) {
    if (fs.existsSync(dir) == true) {
      let files = fs.readdirSync(dir)
      files.forEach(item => {
        let itemPath = path.join(dir, item)
        // console.log(itemPath);
        if (fs.statSync(itemPath).isDirectory()) {
          this.DeleteDirectory(itemPath)
        } else {
          fs.unlinkSync(itemPath)
        }
      })
      fs.rmdirSync(dir)
    }
  },
  debounceBackup: debounce(() => {
    console.log('------------------------------debounceBackup!')
    // 删除多余的备份
    file.removeRedundantBackup()
    // 备份
    file.CopyDirectory(
      dir,
      path.resolve(
        backupDir,
        file.dateFormat('YYYY-mm-dd HH-MM-SS', new Date())
      )
    )
  }, IntervalTime),
  watch() {
    fs.watch(dir, (event, fileName) => {
      console.log(`-----------------------------file change :${fileName}`)
      this.debounceBackup()
    })
  },
  dateFormat(fmt, date) {
    let ret
    const opt = {
      'Y+': date.getFullYear().toString(), // 年
      'm+': (date.getMonth() + 1).toString(), // 月
      'd+': date.getDate().toString(), // 日
      'H+': date.getHours().toString(), // 时
      'M+': date.getMinutes().toString(), // 分
      'S+': date.getSeconds().toString() // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    }
    for (let k in opt) {
      ret = new RegExp('(' + k + ')').exec(fmt)
      if (ret) {
        fmt = fmt.replace(
          ret[1],
          ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0')
        )
      }
    }
    return fmt
  }
}

// let orginDir = path.resolve(
//   process.cwd(),
//   './testdir/atom_atom_0.indexeddb.leveldb'
// )
// let targetDir = path.resolve(process.cwd(), './testdir/target')

// console.log(orginDir, targetDir)
// file.CopyDirectory(orginDir, targetDir)
file.watch()
