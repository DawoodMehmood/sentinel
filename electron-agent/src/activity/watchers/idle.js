import { powerMonitor } from 'electron';
import { onIdleStart, onIdleEnd, onSleepOrShutdown } from '../spanManager.js';

export function initIdleWatcher() {
  powerMonitor.on('lock-screen', onIdleStart);
  powerMonitor.on('suspend', onSleepOrShutdown);
  powerMonitor.on('shutdown', onSleepOrShutdown);
  powerMonitor.on('unlock-screen', onIdleEnd);
}
