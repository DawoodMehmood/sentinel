import axios from 'axios';
import { API_BASE, UPLOAD_BATCH_SIZE, UPLOAD_INTERVAL_MS, MAX_RETRY_BACKOFF_MS } from '../env.js';
import { getDeviceId } from '../device.js';
import { dequeueBatch, deleteThrough } from './queue.js';

let running = false;
let stopped = false;
let token = null;
let companySlug = null;

export function setAuthToken(t) { token = t; }
export function setCompanySlug(slug) { companySlug = slug; }

export function startUploader() {
  if (running) return;
  running = true;
  stopped = false;
  loop();
}

export function stopUploader() { stopped = true; }

async function loop() {
  let backoff = 1000;
  while (!stopped) {
    try {
      if (!token || !companySlug) { await sleep(2000); continue; }
      const { rows, lastId } = dequeueBatch(UPLOAD_BATCH_SIZE);
      if (!rows.length) { await sleep(UPLOAD_INTERVAL_MS); continue; }

      // Filter to only ACTIVE_SPAN; ignore others defensively
      const spans = rows.filter(r => r.type === 'ACTIVE_SPAN').map(e => ({
        type: 'ACTIVE_SPAN',
        app: e.app,
        title: e.title || '',
        titleNorm: e.titleNorm || '',
        startTs: e.startTs,
        endTs: e.endTs,
        durationMs: e.durationMs,
        inferredEnd: !!e.inferredEnd,
      }));

      if (!spans.length) { await sleep(UPLOAD_INTERVAL_MS); continue; }

      await axios.post(`${API_BASE}/agent/upload`, {
        companySlug,
        deviceId: getDeviceId(),
        events: spans,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (lastId) deleteThrough(lastId);
      backoff = 1000;
    } catch (e) {
      await sleep(backoff);
      backoff = Math.min(backoff * 2, MAX_RETRY_BACKOFF_MS);
    }
  }
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
