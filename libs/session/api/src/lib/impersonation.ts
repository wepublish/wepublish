import { createHash } from 'crypto';

export const MAX_IMPERSONATION_MINUTES = 720;
export const DEFAULT_IMPERSONATION_MINUTES = 60;
export const IMPERSONATION_GRANT_TTL_SECONDS = 60;
export const IMPERSONATION_AUDIENCE = 'impersonation';
export const SUPPORT_LOGIN_EMAIL = 'admin@wepublish.ch';

const S256_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

export interface ImpersonationClaims {
  userId: string;
  durationMinutes: number;
  impersonatedBy: string;
  reason: string | null;
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

export function isSupportAccount(email: string): boolean {
  return email.trim().toLowerCase() === SUPPORT_LOGIN_EMAIL;
}

export function codeChallengeOf(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function assertCodeChallenge(
  challenge: string | null | undefined
): string | null {
  if (challenge === undefined || challenge === null) {
    return null;
  }

  if (!S256_CHALLENGE.test(challenge)) {
    throw new ImpersonationError('codeChallenge must be an S256 challenge');
  }

  return challenge;
}

/**
 * Impersonation is on unless a medium explicitly turns it off. The protection
 * does not rest on this switch — a request still has to carry a One-signed
 * channel token with the `write:impersonate` scope, and One only issues one for
 * an operator whose account came through the GitHub staff login. The switch is
 * there for a medium that wants the door shut regardless.
 */
export function isImpersonationEnabled(
  env: Record<string, string | undefined>
): boolean {
  const value = env['WEP_ONE_IMPERSONATION']?.trim().toLowerCase();

  return value !== 'false' && value !== '0' && value !== 'off';
}
