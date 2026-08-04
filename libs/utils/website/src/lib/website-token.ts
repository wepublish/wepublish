import { getApiUrl } from './api-url';

interface TokenState {
  token: string;
  expiresAt: number;
}

interface WebsiteTokenState {
  tokenState: TokenState | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
  pendingTokenResolve: Promise<TokenState> | null;
}

// Use globalThis to persist state across Next.js hot reloads in dev
const state: WebsiteTokenState = (globalThis as any).__websiteToken ?? {
  tokenState: null,
  refreshTimer: null,
  pendingTokenResolve: null,
};

const TOKEN_WAIT_TIMEOUT_MS = 10000;

export async function getWebsiteToken() {
  if (state.tokenState && state.tokenState.expiresAt > Date.now()) {
    return state.tokenState;
  }

  if (state.pendingTokenResolve) {
    return state.pendingTokenResolve;
  }

  const apiUrl = getApiUrl();
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(
      new Error(`Fetch timeout after ${TOKEN_WAIT_TIMEOUT_MS}ms`)
    );
  }, TOKEN_WAIT_TIMEOUT_MS);

  state.pendingTokenResolve = fetch(`${apiUrl}/website/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  })
    .then(response => response.json() as Promise<TokenState>)
    .finally(() => {
      state.pendingTokenResolve = null;
      clearTimeout(timeoutId);
    });

  return state.pendingTokenResolve;
}
