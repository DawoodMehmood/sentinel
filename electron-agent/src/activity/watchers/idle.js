import { powerMonitor } from 'electron';
import { onSleepOrShutdown } from '../spanManager.js';

export function initIdleWatcher() {
  // Record a SYSTEM_OFF when the OS sleeps/shuts down.
  powerMonitor.on('suspend', onSleepOrShutdown);
  powerMonitor.on('shutdown', onSleepOrShutdown);
}
