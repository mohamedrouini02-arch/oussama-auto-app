const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

let mainWindow
let nextServer

const isDev = process.env.NODE_ENV === 'development'
const PORT = 3000

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: "Oussama Auto",
        icon: path.join(__dirname, '../build/icon.png')
    })

    const startUrl = isDev
        ? `http://localhost:${PORT}`
        : `http://localhost:${PORT}`

    mainWindow.loadURL(startUrl)

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
}

async function startServer() {
    if (isDev) {
        console.log('[Electron] Development mode: Waiting for Next.js dev server...')
        return
    }

    const serverStartTime = Date.now()
    console.log('[Electron] Production mode: Starting Next.js standalone server...')

    // Path configuration
    let serverPath
    let serverCwd

    if (app.isPackaged) {
        // When packaged, server is in resources/app/.next/standalone/web/
        serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'web', 'server.js')
        serverCwd = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'web')
    } else {
        // Development mode - server is also in web/ subdirectory
        serverPath = path.join(__dirname, '../.next/standalone/web/server.js')
        serverCwd = path.join(__dirname, '../.next/standalone/web')
    }

    console.log(`[Electron] Server path: ${serverPath}`)
    console.log(`[Electron] Server CWD: ${serverCwd}`)

    const fs = require('fs')
    if (!fs.existsSync(serverPath)) {
        console.error(`[Electron] ERROR: Server not found at ${serverPath}`)
        console.error(`[Electron] Process resources path: ${process.resourcesPath}`)
        console.error(`[Electron] __dirname: ${__dirname}`)
        return
    }

    console.log('[Electron] Server file found, spawning process...')

    nextServer = spawn('node', [serverPath], {
        cwd: serverCwd,
        env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'production' },
        stdio: 'inherit'
    })

    nextServer.on('error', (err) => {
        console.error('[Electron] Failed to start Next.js server:', err)
    })

    nextServer.on('spawn', () => {
        const spawnTime = Date.now() - serverStartTime
        console.log(`[Electron] Server process spawned in ${spawnTime}ms`)
    })
}

const appStartTime = Date.now()
console.log('[Electron] App starting...')

app.whenReady().then(async () => {
    const readyTime = Date.now() - appStartTime
    console.log(`[Electron] App ready in ${readyTime}ms`)

    await startServer()

    // Wait for server to be ready before creating window (simple delay or check)
    if (!isDev) {
        const serverWaitStartTime = Date.now()
        let checkCount = 0
        const checkServer = () => {
            checkCount++
            http.get(`http://localhost:${PORT}`, (res) => {
                const totalWaitTime = Date.now() - serverWaitStartTime
                console.log(`[Electron] Server ready after ${checkCount} checks (${totalWaitTime}ms)`)
                console.log(`[Electron] Total startup time: ${Date.now() - appStartTime}ms`)
                console.log('[Electron] Creating window...')
                createWindow()
            }).on('error', (err) => {
                if (checkCount === 1) {
                    console.log('[Electron] Waiting for server to be ready...')
                }
                setTimeout(checkServer, 1000)
            })
        }
        checkServer()
    } else {
        console.log('[Electron] Creating window (dev mode)...')
        createWindow()
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // Auto-updater logic
    if (!isDev) {
        const { autoUpdater } = require('electron-updater')
        const log = require('electron-log')

        log.transports.file.level = 'info'
        autoUpdater.logger = log

        // Check for updates immediately
        autoUpdater.checkForUpdatesAndNotify()

        // Update check interval (every hour)
        setInterval(() => {
            autoUpdater.checkForUpdatesAndNotify()
        }, 60 * 60 * 1000)

        autoUpdater.on('update-available', () => {
            log.info('Update available.')
        })

        autoUpdater.on('update-downloaded', () => {
            log.info('Update downloaded. Quitting and installing...')
            // Ask user or just install? For now, we'll just install on quit or restart
            // But let's force it for better UX if needed, or notify renderer
            // mainWindow.webContents.send('update-downloaded')

            // For now, silent install on next restart is default behavior of checkForUpdatesAndNotify
            // But we can force it:
            // autoUpdater.quitAndInstall()
        })
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    if (nextServer) {
        nextServer.kill()
    }
})
