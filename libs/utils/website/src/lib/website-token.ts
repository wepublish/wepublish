import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenState {
  token: string;
  expiresAt: number;
}

interface WebsiteTokenState {
  tokenState: TokenState | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
  initializedApiUrl: string | null;
  pendingTokenResolve: ((token: string | null) => void) | null;
}

const REFRESH_THRESHOLD = 0.8;
const TOKEN_WAIT_TIMEOUT_MS = 10000;

// Use globalThis to persist state across Next.js hot reloads in dev
const state: WebsiteTokenState = ((globalThis as any).__websiteToken ??= {
  tokenState: null,
  refreshTimer: null,
  initializedApiUrl: null,
  pendingTokenResolve: null,
});

function parseJwtExp(token: string): number {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString()
  );

  return (payload.exp as number) * 1000;
}

async function validateToken(token: string, apiUrl: string): Promise<boolean> {
  try {
    const jwks = createRemoteJWKSet(new URL(`${apiUrl}/.well-known/jwks.json`));
    await jwtVerify(token, jwks);

    return true;
  } catch {
    return false;
  }
}

function scheduleRefresh(apiUrl: string) {
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer);
  }

  if (!state.tokenState) {
    return;
  }

  const now = Date.now();
  const ttl = state.tokenState.expiresAt - now;
  const refreshAt = ttl * REFRESH_THRESHOLD;

  if (refreshAt <= 0) {
    return;
  }

  state.refreshTimer = setTimeout(() => {
    requestNewToken(apiUrl);
  }, refreshAt);
}

/**
 * Requests a new token from the API.
 * The API will POST the token back to /api/website-token.
 */
async function requestNewToken(apiUrl: string): Promise<void> {
  try {
    await fetch(`${apiUrl}/website/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    console.warn(
      `[WebsiteToken] Failed to request token from API at ${apiUrl}/website/token`
    );
  }
}

/**
 * Initializes the website token system. Call this once at startup.
 * Requests a scoped JWT from the API immediately and sets up automatic refresh.
 */
export function initWebsiteToken(apiUrl: string): void {
  if (state.initializedApiUrl) {
    return;
  }

  state.initializedApiUrl = apiUrl;
  requestNewToken(apiUrl);
}

/**
 * Next.js API route handler for receiving the scoped JWT from the API.
 * Mount this at `/api/website-token` in your Next.js app.
 *
 * Also triggers initialization on first creation (requests token at startup).
 *
 * Usage in `pages/api/website-token.ts`:
 * ```ts
 * import { createWebsiteTokenHandler } from '@wepublish/utils/website';
 * export default createWebsiteTokenHandler(apiUrl);
 * ```
 */
export function createWebsiteTokenHandler(apiUrl: string) {
  initWebsiteToken(apiUrl);

  return async function websiteTokenHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });

      return;
    }

    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Missing token' });

      return;
    }

    const isValid = await validateToken(token, apiUrl);

    if (!isValid) {
      console.warn(`[WebsiteToken] Token validation failed — rejecting token`);

      if (state.pendingTokenResolve) {
        state.pendingTokenResolve(null);
        state.pendingTokenResolve = null;
      }

      res.status(401).json({ error: 'Invalid token' });

      return;
    }

    const expiresAt = parseJwtExp(token);

    state.tokenState = {
      token,
      expiresAt,
    };

    // Resolve any callers waiting for the token
    if (state.pendingTokenResolve) {
      state.pendingTokenResolve(token);
      state.pendingTokenResolve = null;
    }

    scheduleRefresh(apiUrl);

    res.status(200).json({ success: true });
  };
}

/**
 * Returns the current scoped JWT token for querying settings.
 * If no token is available yet (startup still in progress), waits for it.
 */
export async function getWebsiteToken(): Promise<string | null> {
  if (state.tokenState && state.tokenState.expiresAt > Date.now()) {
    return state.tokenState.token;
  }

  if (!state.initializedApiUrl) {
    console.warn(
      `[WebsiteToken] Not initialized. Call initWebsiteToken(apiUrl) or createWebsiteTokenHandler(apiUrl) first.`
    );

    return null;
  }

  const tokenPromise = new Promise<string | null>(resolve => {
    state.pendingTokenResolve = resolve;

    setTimeout(() => {
      if (state.pendingTokenResolve === resolve) {
        state.pendingTokenResolve = null;
        resolve(null);
      }
    }, TOKEN_WAIT_TIMEOUT_MS);
  });

  await requestNewToken(state.initializedApiUrl);

  return tokenPromise;
}
