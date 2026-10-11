export function isValidUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch (_) {
    return false;
  }
}

export function stripQueryAndHash(url: string): string {
  return url.split(/[?#]/, 1)[0];
}
