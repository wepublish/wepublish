export const SUPPORT_LOGIN_PATH = '/login/support';

const STORAGE_KEY = 'wepublish/support-login';

export type SupportLoginAttempt = { state: string; verifier: string };

export type SupportLoginResult = { code: string; state: string };

let captured: SupportLoginResult | null = null;

export function captureSupportLoginResult(): void {
  if (
    window.location.pathname !== SUPPORT_LOGIN_PATH ||
    !window.location.hash
  ) {
    return;
  }

  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const code = fragment.get('code');
  const state = fragment.get('state');

  window.history.replaceState(null, '', SUPPORT_LOGIN_PATH);

  captured = code && state ? { code, state } : null;
}

export function takeCapturedSupportLoginResult(): SupportLoginResult | null {
  const result = captured;
  captured = null;

  return result;
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomToken = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

export async function codeChallengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );

  return base64url(new Uint8Array(digest));
}

export async function startSupportLogin({
  oneUrl,
  origin,
}: {
  oneUrl: string;
  origin: string;
}): Promise<string> {
  const attempt: SupportLoginAttempt = {
    state: randomToken(),
    verifier: randomToken(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));

  const params = new URLSearchParams({
    redirect_uri: `${origin}${SUPPORT_LOGIN_PATH}`,
    state: attempt.state,
    code_challenge: await codeChallengeFor(attempt.verifier),
    code_challenge_method: 'S256',
  });

  return `${oneUrl.replace(/\/+$/, '')}/impersonation/support-login?${params}`;
}

export function takeSupportLoginAttempt(
  state: string | null
): SupportLoginAttempt | null {
  let attempt: SupportLoginAttempt | null = null;

  try {
    attempt = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    attempt = null;
  }

  sessionStorage.removeItem(STORAGE_KEY);

  return attempt?.state && attempt.verifier && attempt.state === state ?
      attempt
    : null;
}
