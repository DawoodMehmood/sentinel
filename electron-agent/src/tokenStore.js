import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import keytar from 'keytar';
import { app } from 'electron';
import { PRODUCT_NAME } from './env.js';

const SERVICE = `${PRODUCT_NAME}-auth`;
const ACCOUNT_TOKEN = 'device-token';
const ACCOUNT_SLUG  = 'company-slug';

export async function saveTokenSecure(token) {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT_TOKEN, token);
  } catch {
    fallbackWrite('token.enc', token);
  }
}

export async function loadTokenSecure() {
  try {
    const v = await keytar.getPassword(SERVICE, ACCOUNT_TOKEN);
    if (v) return v;
  } catch {}
  return fallbackRead('token.enc');
}

export async function clearToken() {
  try { await keytar.deletePassword(SERVICE, ACCOUNT_TOKEN); } catch {}
  fallbackDelete('token.enc');
}

export async function saveCompanySlug(slug) {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT_SLUG, slug);
  } catch {
    fallbackWrite('slug.enc', slug);
  }
}

export async function loadCompanySlug() {
  try {
    const v = await keytar.getPassword(SERVICE, ACCOUNT_SLUG);
    if (v) return v;
  } catch {}
  return fallbackRead('slug.enc');
}

export async function clearCompanySlug() {
  try { await keytar.deletePassword(SERVICE, ACCOUNT_SLUG); } catch {}
  fallbackDelete('slug.enc');
}

/* ---------- fallback encrypted file (when keytar unavailable) ---------- */

function fallbackDir() {
  const dir = path.join(app.getPath('userData'), 'secure');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function osUserKey() {
  return process.platform + ':' + (process.env.USERPROFILE || '') + ':' + (process.env.HOME || '');
}
function fallbackWrite(filename, plaintext) {
  const dir = fallbackDir();
  const file = path.join(dir, filename);
  const key = crypto.createHash('sha256').update(osUserKey()).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  fs.writeFileSync(file, Buffer.concat([iv, tag, enc]));
}
function fallbackRead(filename) {
  try {
    const file = path.join(fallbackDir(), filename);
    if (!fs.existsSync(file)) return null;
    const buf = fs.readFileSync(file);
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const enc = buf.subarray(32);
    const key = crypto.createHash('sha256').update(osUserKey()).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}
function fallbackDelete(filename) {
  try {
    const file = path.join(fallbackDir(), filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
}
