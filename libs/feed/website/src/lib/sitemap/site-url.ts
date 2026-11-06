type HeaderValue = string | string[] | null | undefined;

const firstValue = (value: HeaderValue) =>
  (Array.isArray(value) ? value[0] : value)?.split(',')[0].trim() || undefined;

const siteUrlFromHeaders = (getHeader: (name: string) => HeaderValue) => {
  const host = firstValue(getHeader('x-forwarded-host') ?? getHeader('host'));

  if (!host) {
    return '';
  }

  const protocol =
    firstValue(getHeader('x-forwarded-proto')) ??
    (host.startsWith('localhost') ? 'http' : 'https');

  return `${protocol}://${host}`;
};

export const siteUrlFor = (getHeader: (name: string) => HeaderValue) =>
  (process.env.WEBSITE_URL || siteUrlFromHeaders(getHeader)).replace(/\/$/, '');
