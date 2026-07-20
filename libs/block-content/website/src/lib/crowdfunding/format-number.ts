export const formatNumber = (value: number, locale = 'de-CH') => {
  const formatter = new Intl.NumberFormat(locale);

  // Normalize the grouping separator: Node (SSR) and the browser can emit
  // different apostrophe glyphs for de-CH (U+2019 vs U+0027), which causes a
  // React hydration mismatch. Force a single canonical apostrophe.
  return formatter.format(value).replace(/[’ʼ]/g, "'");
};
