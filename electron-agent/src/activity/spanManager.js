// Builds change-driven ACTIVE_SPAN events and enqueues them.
// A span starts when foreground app/title changes; ends on next change or idle.

import { enqueue } from './queue.js';

let current = null; // { app, title, titleNorm, startTs, lastTs, meta }
const MIN_SWITCH_MS = 300;
const MAX_SPAN_MS = 2 * 60 * 60 * 1000; // 2h checkpoint

function now() { return Date.now(); }

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\b\d+[\w-]*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function closeAndEmit(reason = 'change', inferredEnd = false) {
  if (!current) return;
  const end = current.lastTs || now();
  const dur = end - current.startTs;
  if (dur < MIN_SWITCH_MS) { current = null; return; }

  enqueue({
    type: 'ACTIVE_SPAN',
    ts: end,
    app: current.app,
    title: current.title,
    titleNorm: current.titleNorm,
    startTs: current.startTs,
    endTs: end,
    durationMs: dur,
    inferredEnd,
    meta: current.meta || {},
  });
  current = null;
}

export function onActiveWindowChange({ app, title, pid }) {
  const t = now();
  const titleNorm = normalizeTitle(title || '');
  if (current && current.app === app && current.titleNorm === titleNorm) {
    current.lastTs = t;
    if (t - current.startTs >= MAX_SPAN_MS) {
      closeAndEmit('checkpoint');
      current = { app, title, titleNorm, startTs: t, lastTs: t, meta: { pid } };
    }
    return;
  }
  closeAndEmit('change');
  current = { app, title, titleNorm, startTs: t, lastTs: t, meta: { pid } };
}

export function onIdleStart() {
  closeAndEmit('idle');
}

export function onIdleEnd() {
  // no-op; next active window change starts a fresh span
}

export function onSleepOrShutdown() {
  closeAndEmit('sleep', true);
}

export function stopAndDrain() {
  closeAndEmit('stop');
}
