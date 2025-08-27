import activeWin from 'active-win';
import { onActiveWindowChange } from '../spanManager.js';

let timer = null;
let lastApp = '';

export function startActiveWindowWatcher() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const aw = await activeWin();
      const ownerName = aw?.owner?.name || aw?.owner?.path;
      if (!ownerName) return;

      const app = (ownerName || 'unknown').toLowerCase();

      if (app !== lastApp) {
        lastApp = app;
        // We ignore titles entirely for logging to keep app-level granularity
        onActiveWindowChange({ app, title: '', pid: aw?.owner?.processId });
      }
    } catch {
      // ignore transient errors
    }
  }, 800);
}

export function stopActiveWindowWatcher() {
  if (timer) { clearInterval(timer); timer = null; }
}
