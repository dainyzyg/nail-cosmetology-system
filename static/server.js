var io = require('socket.io')(8888)

io.on('connection', function(socket) {
  // console.log(socket)
  // socket.emit('news', { hello: 'world' })
  let i = 0
  setInterval(() => {
    i += 1
    socket.emit('order', i)
  }, 2000)
  socket.on('c', function(data, cb) {
    console.log(data)
    cb(null, 'qweqeqeqeqeqwe')
    socket.emit('news', data)
  })
  // order setOrderState addAddition login logout
})
