import VModal from 'vue-js-modal'
import App from './Restore.vue'

window.Vue.use(VModal, { dialog: true })
/* eslint-disable no-new */
const instacne = new window.Vue({
  el: '#app',
  render: h => h(App)
})

function errorAlert(text) {
  console.log(VModal)
  instacne.$modal.hide('dialog')
  setTimeout(() => {
    instacne.$modal.show('dialog', {
      title: '错误提示',
      text,
      buttons: [
        {
          title: '确定',
          handler: () => {
            instacne.$modal.hide('dialog')
          }
        }
      ]
    })
  }, 500)
}

window.Vue.config.errorHandler = (err, vm, info) => {
  console.dir(err)

  let catchError = false
  let errorVM = vm
  while (!catchError) {
    if (errorVM.catchError) {
      errorVM.catchError()
      catchError = true
    } else if (errorVM.$parent) {
      errorVM = errorVM.$parent
    } else {
      catchError = true
    }
  }

  if (err.response) {
    console.log(err.response.data.message || err.response.data)
    errorAlert(err.response.data.message || err.response.data)
    return
  }
  if (err.message) {
    console.log(err.message)
    errorAlert(err.message)
  }
}
