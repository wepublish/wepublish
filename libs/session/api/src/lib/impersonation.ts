export const MAX_IMPERSONATION_MINUTES = 720;
export const DEFAULT_IMPERSONATION_MINUTES = 60;
export const IMPERSONATION_GRANT_TTL_SECONDS = 60;
export const IMPERSONATION_AUDIENCE = 'impersonation';

export interface ImpersonationClaims {
  userId: string;
  durationMinutes: number;
  impersonatedBy: string;
  reason: string;
  jti: string;
}

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

export function isImpersonationEnabled(
  env: Record<string, string | undefined>
): boolean {
  return env['WEP_ONE_IMPERSONATION'] === 'true';
}
