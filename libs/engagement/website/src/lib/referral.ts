/**
 * The url params of the current page: a newsletter link only opens the article
 * it links to, so the params of earlier pages are never sent.
 */
export const referralFromUrl = (href: string) => {
  try {
    return [...new URL(href).searchParams.entries()]
      .slice(0, 20)
      .map(([key, value]) => ({ key, value }));
  } catch {
    return [];
  }
};
