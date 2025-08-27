// Builds APP_FOCUS events (point-in-time) and enqueues them after a short dwell.

import { enqueue } from './queue.js';

let currentApp = null;   // string | null
let dwellTimer = null;
const DWELL_MS = 1500;   // user must stay at least this long in the app

function clearDwell() {
  if (dwellTimer) {
    clearTimeout(dwellTimer);
    dwellTimer = null;
  }
}

export function onActiveWindowChange({ app /*, title, pid*/ }) {
  // Only app-level granularity.
  if (app === currentApp) return; // no change

  currentApp = app;
  clearDwell();

  // Schedule an eager slice after dwell
  dwellTimer = setTimeout(() => {
    // Enqueue a single point event for this app focus
    enqueue({
      type: 'APP_FOCUS',
      ts: Date.now(),
      app,
      title: '',      // intentionally blank
      titleNorm: '',  // intentionally blank
    });
    dwellTimer = null;
  }, DWELL_MS);
}

// Called when machine idles/sleeps/shuts down — if you keep those hooks.
// With point events model we don’t need to end anything here.
export function onIdleStart() {}
export function onIdleEnd() {}
export function onSleepOrShutdown() {}

// If you want to emit a SYSTEM_OFF event elsewhere (on toggle OFF),
// do not do it here; do it in main IPC path to ensure upload-before-stop.
export function stopAndDrain() {
  clearDwell();
}
