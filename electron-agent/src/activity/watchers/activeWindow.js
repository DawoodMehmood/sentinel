import activeWin from 'active-win';
import { enqueue } from '../queue.js';

let last = null;
let timer = null;

export function startActiveWindowWatcher() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const aw = await activeWin();
      if (!aw) return;
      const current = { app: aw.owner?.name ?? aw.owner?.path ?? 'unknown', title: aw.title ?? '', pid: aw.owner?.processId };
      if (!last || current.app !== last.app || current.title !== last.title) {
        enqueue({ type: 'WINDOW_FOCUS', ts: Date.now(), app: current.app, title: current.title, pid: current.pid });
        last = current;
      }
    } catch {}
  }, 1000);
}

export function stopActiveWindowWatcher() {
  if (timer) { clearInterval(timer); timer = null; }
}
