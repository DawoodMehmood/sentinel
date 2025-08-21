import os from 'os';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;

export function getDeviceId() {
  return machineIdSync({ original: true });
}

export function getHostname() {
  return os.hostname();
}