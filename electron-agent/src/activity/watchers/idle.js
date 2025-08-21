import { powerMonitor } from 'electron';
import { enqueue } from '../queue.js';

export function initIdleWatcher() {
  powerMonitor.on('lock-screen', () => enqueue({ type: 'IDLE_START', ts: Date.now() }));
  powerMonitor.on('unlock-screen', () => enqueue({ type: 'IDLE_END', ts: Date.now() }));
}
