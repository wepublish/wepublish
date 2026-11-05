import { randomBytes } from 'crypto';
import { hostname } from 'os';
import { type DragonflyConnection } from './dragonfly-connection';

export const lockKey = (name: string) => `lock:${name}`;

export const createLockToken = () =>
  `${hostname()}:${process.pid}:${randomBytes(8).toString('hex')}`;

export const claimLockKey = async (
  connection: DragonflyConnection,
  key: string,
  token: string,
  ttlMs: number
): Promise<'claimed' | 'taken' | 'unavailable'> => {
  if (!connection.isAvailable()) {
    return 'unavailable';
  }

  const written = await connection.set(key, token, { px: ttlMs, nx: true });

  if (written.ok && written.value) {
    return 'claimed';
  }

  const holder = await connection.get(key);

  if (!holder.ok) {
    return 'unavailable';
  }

  if (holder.value === token) {
    return 'claimed';
  }

  return holder.value !== null || written.ok ? 'taken' : 'unavailable';
};
