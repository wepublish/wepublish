import type { RequestInit } from 'node-fetch';

export function nodeFetchTimeoutSignal(
  milliseconds: number
): RequestInit['signal'] {
  return AbortSignal.timeout(milliseconds) as unknown as RequestInit['signal'];
}
