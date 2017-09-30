import { app, BrowserWindow, Menu, Tray, ipcMain } from 'electron'
import path from 'path'
import http from 'http'
import storage from 'electron-json-storage'
import { autoUpdater } from "electron-updater"

autoUpdater.on('update-downloaded', (info) => {
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 5000)
})

const isDevelopment = process.env.NODE_ENV !== 'production'

// define top level variables
let tray
let settings = null
let settingsWindow

// when the app is ready
app.on('ready', () => {

  // hide the dock
  app.dock.hide()

  if (!isDevelopment) autoUpdater.checkForUpdates()

  // set the default tray
  tray = new Tray(path.join(__dirname, 'icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Settings', click() {
      settingsWindow.show()
    }},
    {label: 'Quit', click() {
      app.exit()
    }}
  ])
  tray.setToolTip('Mac Bus')
  tray.setContextMenu(contextMenu)
  tray.setTitle("--min")

  // grab the stored settings
  storage.get('settings', (error, data) => {
    if (error) throw error;
    settings = data

    // get next bus etas
    getNextBusMinutes()
  })

  // create the settings window - hidden
  settingsWindow = new BrowserWindow({
    show: false,
    width: 200,
    height: 250,
    resizable: false,
    alwaysOnTop: true
  })

  // never close the settings window - just hide it
  settingsWindow.on('close', (e) => {
    e.preventDefault()
    settingsWindow.hide()
  })

  // load react app into settingsWindow
  let url = isDevelopment ? 'http://localhost:9080' : `file://${__dirname}/index.html`
  settingsWindow.loadURL(url)

  // check bus ETAs every minute
  setInterval(() => {
    getNextBusMinutes()
  }, 60000)
})

// get Next Bus ETA in minutes
function getNextBusMinutes() {
  // make sure we have agency, route, and stop then make request - otherwise don't make the request
  if (settings && settings.agency && settings.route && settings.stop) http.get('http://restbus.info/api/agencies/' + settings.agency + '/routes/' + settings.route + '/stops/' + settings.stop + '/predictions', (res) => {

      // concact the response into a var string
      let response = ""
      res.on('data', (data) => {
        response += data.toString()
      })

      // when the response ends, parse it and set the tray title
      res.on('end', (data) => {
        response = JSON.parse(response)
        if (response && response[0] && response[0]["values"]) {
          let nextBusETAS = response[0]["values"]
          let nextBusETAString = ""
          nextBusETAS.forEach((eta, index) => {
            if (index < 3) {
              nextBusETAString += eta.minutes + "min"
              if (index < 2 && !(index === nextBusETAS.length - 1)) nextBusETAString += " / "
            }
          })
          tray.setTitle(nextBusETAString)
        } else {
          tray.setTitle("--min")
        }
      })
  }).on('error', (e) => {
    console.log(e);
  });
}

// When ipcRenderer sends the save-settings message, save settings, then getNextBusMinutes
ipcMain.on('save-settings', (e, message) => {
  storage.set('settings', message, function(error) {
    if (error) throw error;
    settings = message
    getNextBusMinutes()
  });
})
