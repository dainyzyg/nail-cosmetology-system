import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import router from './router'
import indexedDBPlugin from './modules/indexedDBPlugin'
// import algorithm from './modules/algorithm'

Vue.config.productionTip = false
// 设置环境变量
window.ENV = process.env.NODE_ENV
window.Vue = Vue

Vue.use(indexedDBPlugin)
// Vue.use(algorithm)
window.algorithm.init(Vue)
Vue.use(ElementUI)

Vue.config.errorHandler = function(err, vm, info) {
  console.error(err)
  ElementUI.MessageBox.alert(err.toString(), '错误提示', {
    confirmButtonText: '确定',
    type: 'error'
  })
}
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
