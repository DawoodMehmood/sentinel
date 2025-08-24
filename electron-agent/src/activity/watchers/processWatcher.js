import psList from 'ps-list';
import { enqueue } from '../queue.js';

let known = new Map();
let procTimer = null;

// This watcher is optional for spans; it emits APP_OPEN/APP_CLOSE which we currently don't upload.
// You can keep it for future analytics or remove to save CPU.
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