export const ONE_URL_TOKEN = Symbol('ONE_URL_TOKEN');
export const ONE_HOST_URL_TOKEN = Symbol('ONE_HOST_URL_TOKEN');

export function normaliseChannelUrl(url: string | undefined | null): string {
  if (!url) {
    return '';
  }

  return url.trim().replace(/\/+$/, '');
}
