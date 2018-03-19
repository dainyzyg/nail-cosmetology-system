var app = require('http').createServer(handler)

app.listen(2222)

function handler(req, res) {
  res.writeHead(200)
  res.end('2222')
}
