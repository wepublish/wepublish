export type DragonflyReply<T> =
  { ok: true; value: T } | { ok: false; reason: 'unavailable' | 'rejected' };

export const UNAVAILABLE_REPLY = { ok: false, reason: 'unavailable' } as const;

export const REJECTED_REPLY = { ok: false, reason: 'rejected' } as const;
