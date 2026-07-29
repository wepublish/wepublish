/**
 * wepublish-site is the only site that serves de/fr on the content level. The
 * locale is encoded as a slug suffix (e.g. `vision-de`, `vision-fr`); the public
 * URL drops it (see the backend `WepublishSiteURLAdapter`) and Next.js i18n adds
 * the `/fr` path prefix. This helper re-adds the suffix when querying content,
 * so the convention lives in one place instead of being string-built per page.
 */
export const localizeSlug = (
  slug: string | string[] | undefined,
  locale: string | undefined
) => `${slug ?? ''}-${locale}`;
