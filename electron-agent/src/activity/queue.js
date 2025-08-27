import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'events.db');
console.log('[Queue] DB path:', dbPath);
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL
)`);

const insertStmt  = db.prepare('INSERT INTO events (ts, type, payload) VALUES (@ts, @type, @payload)');
const fetchStmt   = db.prepare('SELECT id, ts, type, payload FROM events ORDER BY id ASC LIMIT ?');
const deleteStmt  = db.prepare('DELETE FROM events WHERE id <= ?');
const purgeStmt   = db.prepare(`DELETE FROM events WHERE type NOT IN ('APP_FOCUS','SYSTEM_OFF')`);
const countAll    = db.prepare('SELECT COUNT(*) as c FROM events');
const countBad    = db.prepare(`SELECT COUNT(*) as c FROM events WHERE type NOT IN ('APP_FOCUS','SYSTEM_OFF')`);

export function enqueue(evt) {
  insertStmt.run({ ts: evt.ts, type: evt.type, payload: JSON.stringify(evt) });
}

export function dequeueBatch(limit) {
  const rows = fetchStmt.all(limit);
  if (!rows.length) return { rows: [], lastId: null };
  const lastId = rows[rows.length - 1].id;
  return { rows: rows.map(r => JSON.parse(r.payload)), lastId };
}

export function deleteThrough(id) {
  deleteStmt.run(id);
}

/** Purge all non-uploadable events in one shot. Returns number of rows removed. */
export function purgeNonUploadables() {
  const before = countBad.get().c;
  if (before > 0) purgeStmt.run();
  const after = countBad.get().c;
  return before - after;
}

/** Optional helpers for diagnostics */
export function countEvents() {
  return { total: countAll.get().c, nonUploadable: countBad.get().c };
}
