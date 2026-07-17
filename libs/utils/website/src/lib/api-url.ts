export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL_INTERNAL || process.env.API_URL || '';
  }

  return process.env.API_URL ?? '';
}
