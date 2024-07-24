export function isValidUrl(input: string | undefined | null): boolean {
  if (!input) return false
  try {
    new URL(input)
    return true
  } catch (_) {
    return false
  }
}
