import axios from 'axios';
import { API_BASE, UPLOAD_BATCH_SIZE, UPLOAD_INTERVAL_MS, MAX_RETRY_BACKOFF_MS } from '../env.js';
import { getDeviceId } from '../device.js';
import { dequeueBatch, deleteThrough } from './queue.js';

let running = false;
let stopped = false;
let token = null;
let companySlug = null;

// NEW: allow main process to register a fatal auth error handler
let onAuthError = null;
export function setAuthErrorHandler(fn) {
  onAuthError = typeof fn === 'function' ? fn : null;
}

export function setAuthToken(t) {
  token = t;
  console.log('[Uploader] setAuthToken:', token ? 'present' : 'null');
}
export function setCompanySlug(slug) {
  companySlug = slug;
  console.log('[Uploader] setCompanySlug:', companySlug || '(empty)');
}

export function startUploader() {
  if (running) return;
  running = true;
  stopped = false;
  console.log('[Uploader] START');
  loop();
}

export function stopUploader() {
  stopped = true;
  console.log('[Uploader] STOP requested');
}

// Force-upload whatever exists (used on toggle OFF)
export async function flushPending() {
  if (!token || !companySlug) return;
  try {
    while (true) {
      const { rows, lastId } = dequeueBatch(UPLOAD_BATCH_SIZE);
      if (!rows.length) break;

      // All rows are uploadable in this model (APP_FOCUS/SYSTEM_OFF)
      const payload = rows.map((e) => {
        if (e.type === 'APP_FOCUS') {
          return { type: 'APP_FOCUS', app: e.app, ts: e.ts };
        } else {
          return { type: 'SYSTEM_OFF', reason: e.reason || 'stop', ts: e.ts };
        }
      });

      console.log(`[Uploader] FLUSH ${payload.length} event(s) -> ${API_BASE}/agent/upload`);
      await axios.post(
        `${API_BASE}/agent/upload`,
        { companySlug, deviceId: getDeviceId(), events: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (lastId) deleteThrough(lastId);
    }
  } catch (e) {
    console.log('[Uploader] flush error:', e?.message || e);
    // leave rows for retry on next start
  }
}

async function loop() {
  let backoff = 1000;
  while (!stopped) {
    try {
      if (!token || !companySlug) {
        await sleep(2000);
        continue;
      }

      // STRICT threshold: only send when we have at least UPLOAD_BATCH_SIZE rows
      const { rows, lastId } = dequeueBatch(UPLOAD_BATCH_SIZE);
      if (rows.length < UPLOAD_BATCH_SIZE) {
        // not enough yet; don't drop, don't upload; just wait
        await sleep(UPLOAD_INTERVAL_MS);
        continue;
      }

      const payload = rows.map((e) => {
        if (e.type === 'APP_FOCUS') {
          return { type: 'APP_FOCUS', app: e.app, ts: e.ts };
        } else {
          return { type: 'SYSTEM_OFF', reason: e.reason || 'stop', ts: e.ts };
        }
      });

      console.log(`[Uploader] uploading ${payload.length} event(s) -> ${API_BASE}/agent/upload`);
      await axios.post(
        `${API_BASE}/agent/upload`,
        { companySlug, deviceId: getDeviceId(), events: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (lastId) deleteThrough(lastId);
      backoff = 1000;
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || String(e);

      // NEW: Treat 401/403 as fatal auth (deleted user, token invalid, mismatch, etc.)
      if (status === 401 || status === 403) {
        console.warn('[Uploader] fatal auth error:', status, msg);
        if (onAuthError) {
          try { await onAuthError({ status, message: msg }); } catch {}
        }
        // Stop uploader loop; main will clear creds and stop monitoring
        stopped = true;
        running = false;
        return;
      }

      console.log('[Uploader] error; backing off...', msg);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, MAX_RETRY_BACKOFF_MS);
    }
  }
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
