import { createHash, randomBytes } from 'node:crypto';

export const API_TOKEN_PREFIX = 'wep_';

const SECRET_BYTES = 32;
const VISIBLE_SECRET_CHARS = 8;

export function generateApiToken(): string {
  return `${API_TOKEN_PREFIX}${randomBytes(SECRET_BYTES).toString('base64url')}`;
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function prefixOf(token: string): string {
  return token.slice(0, API_TOKEN_PREFIX.length + VISIBLE_SECRET_CHARS);
}
