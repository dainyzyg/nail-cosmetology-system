const path = require('path')

module.exports = {
  entry: {
    big: './other_screens/src/big.js',
    fee: './other_screens/src/fee.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          // vue-loader options go here
        }
      }
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './static/dist')
  }
}
