export const locales = ['de', 'fr'];

export const localeFromSlug = (slug: string | null | undefined) =>
  locales.find(locale => slug?.endsWith(`-${locale}`)) ?? 'de';

export const localizeUrl = (
  siteUrl: string,
  slug: string | null | undefined,
  type: 'article' | 'page'
) => {
  const locale = localeFromSlug(slug);
  const base = (slug ?? '').replace(new RegExp(`-${locale}$`), '');
  const path =
    type === 'article' ? `/a/${base}`
    : base ? `/${base}`
    : '';

  return `${siteUrl}/${locale}${path}`;
};
