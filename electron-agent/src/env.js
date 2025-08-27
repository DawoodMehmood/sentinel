import dotenv from 'dotenv';
dotenv.config();

// Point to your Next.js app router API base (includes /api)
export const API_BASE = process.env.API_BASE ?? 'http://localhost:3000/api';

export const PRODUCT_NAME = process.env.PRODUCT_NAME ?? 'SentinelAgent';
export const UPLOAD_BATCH_SIZE = Number(process.env.UPLOAD_BATCH_SIZE ?? 2);
export const UPLOAD_INTERVAL_MS = Number(process.env.UPLOAD_INTERVAL_MS ?? 3_000);
export const MAX_RETRY_BACKOFF_MS = Number(process.env.MAX_RETRY_BACKOFF_MS ?? 60_000);