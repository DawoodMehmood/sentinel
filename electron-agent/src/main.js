import { app, BrowserWindow, Tray, Menu, screen, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray = null;
let popoverWindow = null;
let isQuitting = false;

// Popover size
const POP_WIDTH = 360;
const POP_HEIGHT = 320;

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'trayTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('Sentinel Agent');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => showPopover()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => togglePopover());
  tray.on('right-click', () => togglePopover());
}

function createPopoverWindow() {
  if (popoverWindow && !popoverWindow.isDestroyed()) return popoverWindow;

  popoverWindow = new BrowserWindow({
    width: POP_WIDTH,
    height: POP_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  Menu.setApplicationMenu(null);

  popoverWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  popoverWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      popoverWindow.hide();
    }
  });

  // 👇 NEW: Auto-hide when clicking outside
  popoverWindow.on('blur', () => {
    if (!isQuitting && popoverWindow.isVisible()) {
      popoverWindow.hide();
    }
  });

  popoverWindow.setSkipTaskbar(true);

  return popoverWindow;
}

function togglePopover() {
  const win = createPopoverWindow();
  if (win.isVisible()) {
    win.hide();
  } else {
    showPopover();
  }
}

function showPopover() {
  const win = createPopoverWindow();

  try {
    const trayBounds = tray.getBounds();
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
    const workArea = display.workArea;

    let x = Math.round(trayBounds.x + trayBounds.width / 2 - POP_WIDTH / 2);
    let y;
    if (process.platform === 'darwin') {
      y = Math.round(trayBounds.y + trayBounds.height + 6);
    } else {
      y = Math.round(trayBounds.y - POP_HEIGHT - 8);
      if (y < workArea.y) y = workArea.y + 8;
    }

    if (x < workArea.x) x = workArea.x + 8;
    if (x + POP_WIDTH > workArea.x + workArea.width) {
      x = workArea.x + workArea.width - POP_WIDTH - 8;
    }

    win.setBounds({ x, y, width: POP_WIDTH, height: POP_HEIGHT });
  } catch {
    const primary = screen.getPrimaryDisplay().workArea;
    win.setBounds({
      x: Math.round(primary.x + (primary.width - POP_WIDTH) / 2),
      y: Math.round(primary.y + (primary.height - POP_HEIGHT) / 2),
      width: POP_WIDTH,
      height: POP_HEIGHT
    });
  }

  win.show();
  win.focus();
}

app.whenReady().then(() => {
  createTray();
  createPopoverWindow();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
});
