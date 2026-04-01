import { getCookie, setCookie } from 'cookies-next';

export const BYPASS_COOKIE_KEY = 'paywall_bypass_token';
const BYPASS_EXPIRY_HOURS = 4;

export function storePaywallBypassToken(token: string): void {
  const maxAge = BYPASS_EXPIRY_HOURS * 60 * 60;

  setCookie(BYPASS_COOKIE_KEY, token, {
    maxAge,
    httpOnly: false,
  });
}

export function hasPaywallBypass(): boolean {
  const token = getCookie(BYPASS_COOKIE_KEY);

  return !!token;
}

export function hasValidPaywallBypass(validTokens: string[]): boolean {
  const token = getCookie(BYPASS_COOKIE_KEY);

  return token ? validTokens.includes(token as string) : false;
}
