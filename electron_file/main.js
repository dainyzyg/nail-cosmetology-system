let environment = 'product' //product dev
const openDevTools = true
const electron = require('electron')

if (process.argv.find((x) => x == '--dev')) {
  environment = 'dev'
}

const { ipcMain, webContents } = require('electron')
ipcMain.on('notice-fee-screen', (event, arg) => {
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('receive-order-info', arg)
  })
})
ipcMain.on('send-fee', (event, arg) => {
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('receive-fee', arg)
  })
})
ipcMain.on('send-dev', (event, arg) => {
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('receive-dev', arg)
  })
})
ipcMain.on('asynchronous-message', (event, arg) => {
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('asynchronous-reply', arg)
  })
})
// Module to control application life.
const app = electron.app
const globalShortcut = electron.globalShortcut
const protocol = electron.protocol
const dialog = electron.dialog
protocol.registerStandardSchemes(['atom'])
// protocol.registerSchemesAsPrivileged([
//   { scheme: 'scheme1', privileges: { standard: true, secure: true } },
//   { scheme: 'scheme2', privileges: { standard: true, secure: true } }
// ])

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
app.setPath('userData', path.join(__dirname, '../../userData'))

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const gotTheLock = app.requestSingleInstanceLock()

app.on('second-instance', (commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (!gotTheLock) {
  return app.quit()
}

function showMessage(message) {
  const options = {
    type: 'info',
    title: '信息',
    message: message,
    buttons: ['是', '否'],
  }
  dialog.showMessageBox(options, function (index) {})
}

function registerProtocol() {
  switch (environment) {
    case 'dev':
      protocol.registerHttpProtocol(
        'atom',
        (request, callback) => {
          const requesturl = request.url.substr(12)
          // showMessage(requesturl)
          callback({ url: 'http://localhost:7000/' + requesturl })
        },
        (error) => {
          if (error) console.error('Failed to register protocol')
        }
      )
      break
    case 'product':
      protocol.registerFileProtocol(
        'atom',
        (request, callback) => {
          let requesturl = request.url.substr(12).replace(/#.*$/, '')
          requesturl = path.join(__dirname, requesturl)
          callback({ path: requesturl })
        },
        (error) => {
          if (error) console.error('Failed to register protocol')
        }
      )
      break
  }
}

function createWindow() {
  if (mainWindow) {
    return
  }
  registerProtocol()
  globalShortcut.register('f1', () => {
    // Do stuff when Y and either Command/Control is pressed.
    mainWindow.webContents.toggleDevTools()
  })

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      nodeIntegrationInWorker: true,
    },
  })
  mainWindow.maximize()
  mainWindow.loadURL('atom://atom/index.html')
  // and load the index.html of the app.
  // mainWindow.loadURL(
  //   url.format({
  //     pathname: path.join(__dirname, './index.html'),
  //     protocol: 'atom:',
  //     slashes: true
  //   })
  // )
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  // Open the DevTools.
  if (openDevTools) {
    mainWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    app.quit()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
