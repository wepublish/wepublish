export function modifierKeyLabel(
  platform: string | undefined = typeof navigator === 'undefined' ? undefined
  : navigator.platform
): string {
  return /mac|iphone|ipad|ipod/i.test(platform ?? '') ? '⌘' : 'Ctrl';
}
