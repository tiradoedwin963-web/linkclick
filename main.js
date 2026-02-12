const { app, BrowserWindow, screen } = require('electron');
const ioHookModule = require('uiohook-napi');
const path = require('path'); // 引入 path 模块，处理路径更稳
const uiohook = ioHookModule.uIOhook;

let mainWindow;
let isPassthrough = false; // State: false = Draggable, true = Passthrough
let mouseTrackInterval = null;

app.on('ready', () => {
    console.log("[OK] Electron is ready");

    mainWindow = new BrowserWindow({
        width: 300,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        // 👇👇👇 核心修改：让任务栏和运行时也显示小八图标 👇👇👇
        icon: path.join(__dirname, 'icon.ico'),
        // 👆👆👆 修改结束
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    // Default: Draggable
    mainWindow.setIgnoreMouseEvents(false);

    initializeKeyboardListener();
    initializeMouseTracker();
});

function initializeKeyboardListener() {
    console.log("[INFO] Initializing keyboard listener...");

    if (!uiohook) {
        console.error("[ERROR] uiohook object is null!");
        return;
    }

    try {
        uiohook.on('keydown', (event) => {
            // Check for Ctrl key (keycode: 29 or 3612)
            if (event.keycode === 29 || event.keycode === 3612) {
                // Toggle state
                isPassthrough = !isPassthrough;

                if (isPassthrough) {
                    // Passthrough ON: Click through the pet
                    mainWindow.setIgnoreMouseEvents(true, { forward: true });
                    console.log(">>> [MODE] Passthrough: ON (Background clickable, Pet unmovable)");
                } else {
                    // Passthrough OFF: Drag the pet
                    mainWindow.setIgnoreMouseEvents(false);
                    console.log(">>> [MODE] Interactive: ON (Pet draggable)");
                }
            }

            // Send key event to renderer
            if (mainWindow) {
                mainWindow.webContents.send('key-action', 'down', event.keycode);
            }
        });

        uiohook.on('keyup', (event) => {
            if (mainWindow) {
                mainWindow.webContents.send('key-action', 'up');
            }
        });

        uiohook.start();
        console.log("[OK] Keyboard listener started");
    } catch (error) {
        console.error("[ERROR] Failed to start:", error);
    }
}

// ========== 全局鼠标位置追踪 ==========
function initializeMouseTracker() {
    console.log("[INFO] Starting mouse tracker...");

    // 每 16ms (~60fps) 轮询鼠标位置
    mouseTrackInterval = setInterval(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        const cursorPos = screen.getCursorScreenPoint();
        const windowBounds = mainWindow.getBounds();

        // 发送鼠标位置和窗口位置给渲染进程
        mainWindow.webContents.send('mouse-position', {
            mouseX: cursorPos.x,
            mouseY: cursorPos.y,
            windowX: windowBounds.x,
            windowY: windowBounds.y,
            windowWidth: windowBounds.width,
            windowHeight: windowBounds.height
        });
    }, 16);

    console.log("[OK] Mouse tracker started");
}

app.on('window-all-closed', () => {
    if (mouseTrackInterval) clearInterval(mouseTrackInterval);
    uiohook.stop();
    app.quit();
});