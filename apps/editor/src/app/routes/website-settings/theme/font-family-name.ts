export const fontFamilyName = (value: string | null | undefined) =>
  (value ?? '')
    .split(',')[0]
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2');
