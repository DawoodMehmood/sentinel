import activeWin from 'active-win';
import { onActiveWindowChange } from '../spanManager.js';

let timer = null;

export function startActiveWindowWatcher() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const aw = await activeWin();
      if (!aw?.owner?.name) return;
      const app = (aw.owner.name || aw.owner.path || 'unknown').toLowerCase();
      const title = aw.title || '';
      const pid = aw.owner.processId;
      onActiveWindowChange({ app, title, pid });
    } catch {
      // ignore
    }
  }, 800); // ~1.25 Hz; spanManager handles dedupe
}

export function stopActiveWindowWatcher() {
  if (timer) { clearInterval(timer); timer = null; }
}
