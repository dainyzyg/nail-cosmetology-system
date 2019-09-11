var io = require('socket.io')(8888)

window.ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(`io.emit('orderchange', arg)`)
  io.emit('orderchange', arg)
})

io.on('connection', function(socket) {
  console.log('connection')
  // socket.emit('news', { hello: 'world' })
  // let i = 0
  // setInterval(() => {
  //   i += 1
  //   socket.emit('order', i)
  // }, 2000)
  socket.on('login', async (data, cb) => {
    let technician = null
    await window.IDB.executeTransaction(['technician'], 'readonly', (t) => {
      const store = t.objectStore('technician')
      const request = store.openCursor()
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.name == data.userName && (cursor.value.password || '') == data.password) {
            technician = cursor.value
          } else {
            cursor.continue()
          }
        }
      }
    })
    if (technician) {
      cb(null, { error: null, technician })
    }
    cb(null, { error: '用户名或密码错误！' })
  })
  socket.on('order', async (data, cb) => {
    const assignList = await window.algorithm.getAssignList()
    cb(null, assignList)
  })
  // order setOrderState addAddition login logout
})
