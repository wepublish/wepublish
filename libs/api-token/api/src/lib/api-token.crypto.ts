import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';

export const API_TOKEN_PREFIX = 'wep_';

const SECRET_BYTES = 32;
const VISIBLE_SECRET_CHARS = 8;

export function generateApiToken(): string {
  return `${API_TOKEN_PREFIX}${randomBytes(SECRET_BYTES).toString('base64url')}`;
}

export function hashApiToken(token: string): Promise<string> {
  return hash(token);
}

export async function verifyApiToken(
  tokenHash: string,
  token: string
): Promise<boolean> {
  return verify(tokenHash, token).catch(() => false);
}

export function prefixOf(token: string): string {
  return token.slice(0, API_TOKEN_PREFIX.length + VISIBLE_SECRET_CHARS);
}
