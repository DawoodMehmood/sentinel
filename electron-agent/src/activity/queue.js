import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'events.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL
)`);

const insertStmt = db.prepare('INSERT INTO events (ts, type, payload) VALUES (@ts, @type, @payload)');
const fetchStmt = db.prepare('SELECT id, ts, type, payload FROM events ORDER BY id ASC LIMIT ?');
const deleteStmt = db.prepare('DELETE FROM events WHERE id <= ?');

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