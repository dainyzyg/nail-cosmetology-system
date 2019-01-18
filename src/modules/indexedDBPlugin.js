const IDB = {
  db: null,
  cb: [],
  async getDB() {
    if (this.db) {
      return this.db
    }
    await this.waitDBinit()
    return this.db
  },
  waitDBinit() {
    return new Promise((resolve, reject) => {
      this.cb.push(() => {
        resolve()
      })
    })
  },
  async getObjectStore(osName, mode) {
    let db = this.db
    if (!db) {
      db = await this.getDB()
    }
    const m = mode || 'readonly'
    const t = db.transaction(osName, m)
    return t.objectStore(osName)
  },
  async executeTransaction(storeNames, mode, cb) {
    let db = this.db
    if (!db) {
      db = await this.getDB()
    }
    const m = mode || 'readonly'
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeNames, m)
      t.onerror = e => {
        console.log('t error')
        console.log(e)
        reject(e)
      }
      t.onabort = e => {
        console.log('t abort')
        reject(e)
      }
      t.oncomplete = e => {
        resolve(1)
      }
      cb(t)
    })
  },
  async delete(osName, id) {
    const store = await this.getObjectStore(osName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = event => {
        resolve(1)
      }
    })
  },
  async add(osName, record) {
    const store = await this.getObjectStore(osName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(record)
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = event => {
        resolve(1)
      }
    })
  },
  async put(osName, record, key) {
    const store = await this.getObjectStore(osName, 'readwrite')
    return new Promise((resolve, reject) => {
      let request
      if (key) {
        request = store.put(record, key)
      } else {
        request = store.put(record)
      }
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = event => {
        resolve(1)
      }
    })
  },
  async get(osName, value) {
    const store = await this.getObjectStore(osName)
    return new Promise((resolve, reject) => {
      const request = store.get(value)
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = e => {
        resolve(e.target.result)
      }
    })
  },
  async getAll(osName) {
    const store = await this.getObjectStore(osName)
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = e => {
        resolve(e.target.result)
      }
    })
  },
  async getAllByIndex(osName, indexName, query = null) {
    const store = await this.getObjectStore(osName)
    return new Promise((resolve, reject) => {
      const request = store.index(indexName).getAll(query)
      request.onerror = e => {
        reject(e)
      }
      request.onsuccess = e => {
        resolve(e.target.result)
      }
    })
  },
  async executeCursor(osName, index, query, cb) {
    const datalist = []
    const store = await this.getObjectStore(osName)
    let myIndex
    if (index) {
      myIndex = store.index(index)
    } else {
      myIndex = store
    }
    return new Promise((resolve, reject) => {
      const request = myIndex.openCursor(query, 'prev')
      request.onerror = () => {
        reject(new Error('通过游标获取数据报错'))
      }
      request.onsuccess = event => {
        const cursor = event.target.result
        if (cb && cursor) {
          if (cb(cursor)) {
            datalist.push(cursor.value)
          }
        } else if (cursor) {
          datalist.push(cursor.value)
          cursor.continue()
        } else {
          resolve(datalist)
        }
      }
    })
  },
  async openIndexCursor(osName, index, query, cb) {
    const datalist = []
    const store = await this.getObjectStore(osName)
    const myIndex = store.index(index)
    return new Promise((resolve, reject) => {
      const request = myIndex.openCursor(query, 'prev')
      request.onerror = () => {
        reject(new Error('通过游标获取数据报错'))
      }
      request.onsuccess = event => {
        const cursor = event.target.result
        if (cursor) {
          datalist.push(cursor.value)
          cursor.continue()
        } else {
          resolve(datalist)
        }
      }
    })
  },
  async openCursor(osName) {
    const datalist = []
    const store = await this.getObjectStore(osName)
    return new Promise((resolve, reject) => {
      const request = store.openCursor(null, 'prev')
      request.onerror = () => {
        reject(new Error('通过游标获取数据报错'))
      }
      request.onsuccess = event => {
        const cursor = event.target.result
        if (cursor) {
          datalist.push(cursor.value)
          cursor.continue()
        } else {
          resolve(datalist)
        }
      }
    })
  }
}
// function createStore(event, osList) {
//   const db = event.target.result
//   const t = event.target.transaction
//   for (const osName of osList) {
//     if (!db.objectStoreNames.contains(osName)) {
//       db.createObjectStore(osName, { keyPath: 'number' })
//     }
//     const os = t.objectStore(osName)
//     if (!os.indexNames.contains('subscriber')) {
//       os.createIndex('subscriber', 'subscriber', { unique: false })
//     }
//     if (!os.indexNames.contains('model')) {
//       os.createIndex('model', 'model', { unique: false })
//     }
//     if (!os.indexNames.contains('size')) {
//       os.createIndex('size', 'size', { unique: false })
//     }
//     if (!os.indexNames.contains('orderDate')) {
//       os.createIndex('orderDate', 'orderDate', { unique: false })
//     }
//     // if (!os.indexNames.contains('search2')) {
//     //   os.createIndex('search2', ['orderDate', 'subscriber', 'model', 'size'], {
//     //     unique: false
//     //   })
//     // }
//   }
// }
function createStoreAndIndex(event, osName, indexs, option) {
  const db = event.target.result
  const t = event.target.transaction
  if (!db.objectStoreNames.contains(osName)) {
    db.createObjectStore(osName, option)
  }
  const os = t.objectStore(osName)
  for (const index of indexs) {
    if (!os.indexNames.contains(index)) {
      os.createIndex(index, index, { unique: false })
    }
  }
}
function initIndexedDB(Vue) {
  Object.defineProperty(Vue.prototype, '$IDB', {
    get() {
      return IDB
    }
  })
  const openRequest = indexedDB.open('MyDatabase', 16)
  openRequest.onerror = event => {
    console.log(event, event.target.error.message)
  }
  openRequest.onsuccess = event => {
    IDB.db = event.target.result
    for (const c of IDB.cb) {
      c()
    }
  }
  openRequest.onupgradeneeded = event => {
    createStoreAndIndex(event, 'kind', [], { keyPath: 'id' })
    createStoreAndIndex(event, 'project', ['parentID'], { keyPath: 'id' })
    createStoreAndIndex(event, 'addition', ['parentID'], { keyPath: 'id' })
    createStoreAndIndex(event, 'technician', ['index'], { keyPath: 'id' })
    createStoreAndIndex(event, 'order', ['orderDate', 'preorderTime'], { keyPath: 'id' })
    createStoreAndIndex(event, 'attendance', ['date'], { keyPath: ['id', 'date'] })
    createStoreAndIndex(event, 'assign', ['date', 'orderID'], { keyPath: ['orderID', 'projectID'] })
    createStoreAndIndex(event, 'assignList', [], { keyPath: 'date' })
    createStoreAndIndex(event, 'feeInfo', [], { keyPath: 'percentage' })
    createStoreAndIndex(event, 'devData', [], { keyPath: 'name' })
    createStoreAndIndex(event, 'schedule', [], { keyPath: 'date' })
    createStoreAndIndex(event, 'workingTable', [], { keyPath: 'id' })
    createStoreAndIndex(event, 'checkoutList', ['date'], { keyPath: 'id' })
  }
}
window.IDB = IDB
export default {
  install(Vue, options) {
    initIndexedDB(Vue)
  }
}
