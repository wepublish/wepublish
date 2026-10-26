import { ExternalAppApiTokenFragment } from '@wepublish/editor/api';

/** How long before its expiry an app's API key is announced. */
export const API_KEY_WARNING_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ApiKeyStatus = 'ok' | 'expiresSoon' | 'expired' | 'revoked';

/** Null without a linked key (or one the editor may not see). */
export function apiKeyStatus(
  apiToken:
    | Pick<ExternalAppApiTokenFragment, 'expiresAt' | 'revokedAt'>
    | null
    | undefined,
  now = new Date()
): ApiKeyStatus | null {
  if (!apiToken) {
    return null;
  }

  if (apiToken.revokedAt) {
    return 'revoked';
  }

  const expiresIn = new Date(apiToken.expiresAt).getTime() - now.getTime();

  if (expiresIn <= 0) {
    return 'expired';
  }

  return expiresIn < API_KEY_WARNING_DAYS * DAY_MS ? 'expiresSoon' : 'ok';
}
