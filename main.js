
const {app, protocol, BrowserWindow, webContents} = require('electron')
const path = require('path')

const {getToken} = require('./auth')

let mainWindow

function registerProtocol() {
  protocol.registerFileProtocol('view', (request, callback) => {
    const url = request.url.substr(7)
    callback({path: path.normalize(`${__dirname}/${url}`)})
  }, (error) => {
    if (error) console.error('Failed to register protocol')
  })
}

function createWindow () {
  registerProtocol()

  mainWindow = new BrowserWindow()
  getToken(mainWindow, function (err, token) {
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('reddit-token', token)
    })
  })
  // mainWindow.loadURL(`file://${__dirname}/index.html?a=b`)
  // mainWindow.loadURL("view://index.html")
  // mainWindow.loadURL("view://reddit_redirect.html")

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
