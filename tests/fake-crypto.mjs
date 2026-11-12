import { createHash } from 'node:crypto';
export const CryptoDigestAlgorithm = { SHA256: 'SHA-256' };
export async function digestStringAsync(_a, s) { return createHash('sha256').update(s).digest('hex'); }
