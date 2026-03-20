import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#111318',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111318',
      symbolColor: '#e2e2e8',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers for settings persistence
ipcMain.handle('store:get', async (_event, key: string) => {
  const Store = (await import('electron-store')).default
  const store = new Store()
  return store.get(key)
})

ipcMain.handle('store:set', async (_event, key: string, value: unknown) => {
  const Store = (await import('electron-store')).default
  const store = new Store()
  store.set(key, value)
})

ipcMain.handle('store:delete', async (_event, key: string) => {
  const Store = (await import('electron-store')).default
  const store = new Store()
  store.delete(key)
})
