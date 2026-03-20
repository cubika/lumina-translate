import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  aiCall: (req: unknown) => ipcRenderer.invoke('ai:call', req),
})
