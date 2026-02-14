const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    // Add any specific electron APIs here if needed
    // For now, we just want to ensure the app loads securely
})
