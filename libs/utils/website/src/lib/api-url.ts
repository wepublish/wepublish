// import getConfig from 'next/config';

export function getApiUrl(): string {
  // const { publicRuntimeConfig } = getConfig() ?? {};

  if (typeof window === 'undefined') {
    return (process.env.API_URL_INTERNAL || process.env.API_URL) ?? '';
  }

  return process.env.API_URL ?? '';
}
