import dotenv from 'dotenv';
dotenv.config();

export const API_BASE = process.env.API_BASE ?? 'http://localhost:4000';
export const PRODUCT_NAME = process.env.PRODUCT_NAME ?? 'YourAgent';
export const UPLOAD_BATCH_SIZE = Number(process.env.UPLOAD_BATCH_SIZE ?? 50);
export const UPLOAD_INTERVAL_MS = Number(process.env.UPLOAD_INTERVAL_MS ?? 10_000);
export const MAX_RETRY_BACKOFF_MS = Number(process.env.MAX_RETRY_BACKOFF_MS ?? 60_000);
