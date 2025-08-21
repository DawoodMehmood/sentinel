import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import keytar from 'keytar';
import { app } from 'electron';
import { PRODUCT_NAME } from './env.js';

const SERVICE = `${PRODUCT_NAME}-auth`;
const ACCOUNT = 'device-token';

export async function saveTokenSecure(token) {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT, token);
  } catch (e) {
    const dir = path.join(app.getPath('userData'), 'secure');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'token.enc');
    const key = crypto.createHash('sha256').update(osUserKey()).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    fs.writeFileSync(file, Buffer.concat([iv, tag, enc]));
  }
}

export async function loadTokenSecure() {
  try {
    const v = await keytar.getPassword(SERVICE, ACCOUNT);
    if (v) return v;
  } catch {}
  try {
    const dir = path.join(app.getPath('userData'), 'secure');
    const file = path.join(dir, 'token.enc');
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

export async function clearToken() {
  try { await keytar.deletePassword(SERVICE, ACCOUNT); } catch {}
  try {
    const file = path.join(app.getPath('userData'), 'secure', 'token.enc');
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
}

function osUserKey() {
  return process.platform + ':' + (process.env.USERPROFILE || '') + ':' + (process.env.HOME || '');
}