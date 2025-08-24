import { app, BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

import { getDeviceId, getHostname } from './device.js';
import {
  saveTokenSecure,
  loadTokenSecure,
  clearToken as clearSecureToken,
  saveCompanySlug,
  loadCompanySlug,
  clearCompanySlug,
} from './tokenStore.js';
import { startActiveWindowWatcher, stopActiveWindowWatcher } from './activity/watchers/activeWindow.js';
import { startProcessWatcher, stopProcessWatcher } from './activity/watchers/processWatcher.js';
import { initIdleWatcher } from './activity/watchers/idle.js';
import { startUploader, stopUploader, setAuthToken, setCompanySlug as setUploaderCompanySlug } from './activity/uploader.js';
import { API_BASE } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray = null;
let popoverWindow = null;
let isQuitting = false;
let monitoring = false;
let token = null;
let boundCompanySlug = '';

const POP_WIDTH = 360;
const POP_HEIGHT = 240;
const IS_DEV = !app.isPackaged;

axios.interceptors.request.use((cfg) => {
  console.log(`[HTTP] → ${cfg.method?.toUpperCase()} ${cfg.url}`);
  return cfg;
});
axios.interceptors.response.use(
  (res) => { console.log(`[HTTP] ← ${res.status} ${res.config.url}`); return res; },
  (err) => {
    if (err.response) console.error(`[HTTP] × ${err.response.status} ${err.config?.url}`, err.response.data);
    else console.error('[HTTP] × Network error', err.message);
    return Promise.reject(err);
  }
);

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'trayTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Sentinel Agent');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => showPopover() },
    ...(IS_DEV ? [{ label: 'Open DevTools', click: () => openDevTools() }] : []),
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
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
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  Menu.setApplicationMenu(null);
  popoverWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  popoverWindow.on('blur', () => {
    if (!isQuitting && popoverWindow.isVisible()) popoverWindow.hide();
  });
  popoverWindow.on('close', (e) => { if (!isQuitting) { e.preventDefault(); popoverWindow.hide(); } });

  popoverWindow.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape' && popoverWindow.isVisible()) popoverWindow.hide();
    const ctrlOrCmd = process.platform === 'darwin' ? input.meta : input.control;
    if (IS_DEV && input.type === 'keyDown' && ctrlOrCmd && input.alt && input.code === 'KeyI') openDevTools();
  });

  if (IS_DEV) popoverWindow.webContents.once('did-finish-load', () => openDevTools());
  popoverWindow.setSkipTaskbar(true);
  return popoverWindow;
}

function openDevTools() {
  const win = createPopoverWindow();
  if (!win.webContents.isDevToolsOpened()) win.webContents.openDevTools({ mode: 'detach' });
}

function togglePopover() {
  const win = createPopoverWindow();
  if (win.isVisible()) win.hide(); else showPopover();
}

function showPopover() {
  const win = createPopoverWindow();

  try {
    const trayBounds = tray.getBounds();
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
    const work = display.workArea;
    let x = Math.round(trayBounds.x + trayBounds.width / 2 - POP_WIDTH / 2);
    let y;
    if (process.platform === 'darwin') y = Math.round(trayBounds.y + trayBounds.height + 6);
    else {
      y = Math.round(trayBounds.y - POP_HEIGHT - 8);
      if (y < work.y) y = work.y + 8;
    }
    if (x < work.x) x = work.x + 8;
    if (x + POP_WIDTH > work.x + work.width) x = work.x + work.width - POP_WIDTH - 8;
    win.setBounds({ x, y, width: POP_WIDTH, height: POP_HEIGHT });
  } catch {
    const w = screen.getPrimaryDisplay().workArea;
    win.setBounds({ x: Math.round(w.x + (w.width - POP_WIDTH) / 2), y: Math.round(w.y + (w.height - POP_HEIGHT) / 2), width: POP_WIDTH, height: POP_HEIGHT });
  }

  win.show();
  win.focus();
}

/** ===== Agent control ===== */

async function registerDeviceAndSaveToken({ token: t, companySlug }) {
  const body = {
    companySlug: (companySlug || '').toLowerCase(),
    deviceId: getDeviceId(),
    platform: process.platform,
    hostname: getHostname(),
  };

  const res = await axios.post(`${API_BASE}/agent/register-device`, body, {
    headers: { Authorization: `Bearer ${t}` },
  });

  token = t;
  boundCompanySlug = res?.data?.company || body.companySlug || '';
  setAuthToken(t);
  setUploaderCompanySlug(boundCompanySlug);
  await saveTokenSecure(t);
  await saveCompanySlug(boundCompanySlug);
}

function startMonitoring() {
  if (monitoring) return;
  monitoring = true;
  startActiveWindowWatcher();
  startProcessWatcher();   // optional; not required for spans
  initIdleWatcher();
  startUploader();
  console.log('[Agent] Monitoring STARTED');
}

function stopMonitoring() {
  if (!monitoring) return;
  monitoring = false;
  stopActiveWindowWatcher();
  stopProcessWatcher();
  stopUploader();
  console.log('[Agent] Monitoring STOPPED');
}

/** ===== IPC (renderer <-> main) ===== */

ipcMain.handle('agent:getStatus', async () => {
  return { authenticated: !!token, running: monitoring, companySlug: boundCompanySlug };
});

ipcMain.handle('agent:submitToken', async (_e, payload /* { token, companySlug } */) => {
  try {
    if (!payload?.token) throw new Error('Missing token');
    if (!payload?.companySlug) throw new Error('Missing company slug');
    await registerDeviceAndSaveToken(payload);
    return { ok: true };
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Registration failed';
    console.error('[Agent] submitToken error:', msg);
    return { ok: false, error: msg };
  }
});

ipcMain.handle('agent:toggle', async (_e, on) => {
  if (!token) return { ok: false, error: 'Not registered' };
  if (on) startMonitoring(); else stopMonitoring();
  return { ok: true, running: monitoring };
});

ipcMain.handle('agent:clearToken', async () => {
  await clearSecureToken();
  await clearCompanySlug();
  token = null;
  boundCompanySlug = '';
  setAuthToken(null);
  setUploaderCompanySlug(null);
  stopMonitoring();
  return { ok: true };
});

app.whenReady().then(async () => {
  if (IS_DEV) app.commandLine.appendSwitch('enable-logging');

  createTray();
  createPopoverWindow();

  token = await loadTokenSecure();
  boundCompanySlug = await loadCompanySlug();
  setAuthToken(token);
  setUploaderCompanySlug(boundCompanySlug);

  // Optional: auto-start monitoring if token is present
  if (token) startMonitoring();
});

app.on('window-all-closed', (e) => { e.preventDefault(); });
app.on('before-quit', () => { isQuitting = true; });
