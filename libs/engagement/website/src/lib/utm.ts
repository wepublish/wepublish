import { getCookie, setCookie } from 'cookies-next';

export const UTM_COOKIE_KEY = 'wep_utm';

/**
 * The `key=value` utm params of the link that brought the reader: taken from
 * the landing page and kept in a session cookie for the pages after it.
 */
export function utmOfVisit(search = window.location.search): string[] {
  const fromLink = [...new URLSearchParams(search)]
    .filter(([key, value]) => key.toLowerCase().startsWith('utm_') && value)
    .map(([key, value]) => `${key}=${value}`);

  if (fromLink.length) {
    // No maxAge: the cookie ends with the browser session.
    setCookie(UTM_COOKIE_KEY, JSON.stringify(fromLink), {
      path: '/',
      sameSite: 'lax',
    });

    return fromLink;
  }

  try {
    const kept: unknown = JSON.parse(String(getCookie(UTM_COOKIE_KEY) ?? '[]'));

    return Array.isArray(kept) ?
        kept.filter((param): param is string => typeof param === 'string')
      : [];
  } catch {
    return [];
  }
}
