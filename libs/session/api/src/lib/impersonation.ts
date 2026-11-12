export const MAX_IMPERSONATION_MINUTES = 720;
export const DEFAULT_IMPERSONATION_MINUTES = 60;

export class ImpersonationError extends Error {}

export function assertDuration(minutes: number): number {
  if (!Number.isInteger(minutes) || minutes < 1) {
    throw new ImpersonationError('durationMinutes must be a positive integer');
  }

  if (minutes > MAX_IMPERSONATION_MINUTES) {
    throw new ImpersonationError(
      `durationMinutes must not exceed ${MAX_IMPERSONATION_MINUTES}`
    );
  }

  return minutes;
}

export function assertReason(reason: string): string {
  const trimmed = (reason ?? '').trim();

  if (trimmed.length < 3) {
    throw new ImpersonationError('reason is required');
  }

  return trimmed.slice(0, 500);
}
