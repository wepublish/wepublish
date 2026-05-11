import getConfig from 'next/config';

export function getApiUrl(): string {
  const { publicRuntimeConfig, serverRuntimeConfig } = getConfig() ?? {};

  if (typeof window === 'undefined') {
    return (
      serverRuntimeConfig?.env?.API_URL_INTERNAL ||
      publicRuntimeConfig?.env?.API_URL ||
      ''
    );
  }

  return publicRuntimeConfig?.env?.API_URL ?? '';
}
