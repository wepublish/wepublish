import { CombinedGraphQLErrors } from '@apollo/client';

export const WEPUBLISH_LOGIN_PATH = '/login/wepublish';

const STORAGE_KEY = 'wepublish/wepublish-login';

export type WepublishLoginClient = {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
};

export type WepublishLoginAttempt = { state: string; verifier: string };

export type WepublishLoginResult = { code: string; state: string };

let captured: WepublishLoginResult | null = null;

export const isForbidden = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some(({ extensions }) => extensions?.['code'] === 'FORBIDDEN');

export function captureWepublishLoginResult(): void {
  if (
    window.location.pathname !== WEPUBLISH_LOGIN_PATH ||
    !window.location.hash
  ) {
    return;
  }

  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const code = fragment.get('code');
  const state = fragment.get('state');

  window.history.replaceState(null, '', WEPUBLISH_LOGIN_PATH);

  captured = code && state ? { code, state } : null;
}

export function takeCapturedWepublishLoginResult(): WepublishLoginResult | null {
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

export async function startWepublishLogin({
  client,
  origin,
}: {
  client: WepublishLoginClient;
  origin: string;
}): Promise<string> {
  const target = new URL(client.authorizationUrl);

  if (target.protocol !== 'https:') {
    throw new Error(
      `The We.Publish login needs an https address, got ${target.protocol}`
    );
  }

  if (new URL(client.redirectUri).origin !== origin) {
    throw new Error(
      `The We.Publish login returns to ${client.redirectUri}, not to ${origin}`
    );
  }

  const attempt: WepublishLoginAttempt = {
    state: randomToken(),
    verifier: randomToken(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));

  target.search = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: client.redirectUri,
    response_type: 'code',
    response_mode: 'fragment',
    scope: client.scope,
    state: attempt.state,
    code_challenge: await codeChallengeFor(attempt.verifier),
    code_challenge_method: 'S256',
  }).toString();

  return target.toString();
}

export function takeWepublishLoginAttempt(
  state: string | null
): WepublishLoginAttempt | null {
  let attempt: WepublishLoginAttempt | null = null;

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
