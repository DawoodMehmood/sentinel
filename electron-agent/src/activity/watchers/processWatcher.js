import psList from 'ps-list';
import { enqueue } from '../queue.js';

let known = new Map();
let procTimer = null;

export function startProcessWatcher() {
  if (procTimer) return;
  procTimer = setInterval(async () => {
    try {
      const list = await psList();
      const seen = new Map();
      for (const p of list) {
        seen.set(p.pid, p.name);
        if (!known.has(p.pid)) {
          enqueue({ type: 'APP_OPEN', ts: Date.now(), app: p.name, pid: p.pid });
        }
      }
      for (const [pid, name] of known) {
        if (!seen.has(pid)) {
          enqueue({ type: 'APP_CLOSE', ts: Date.now(), app: name, pid });
        }
      }
      known = seen;
    } catch {}
  }, 3000);
}

export function stopProcessWatcher() {
  if (procTimer) { clearInterval(procTimer); procTimer = null; known.clear(); }
}