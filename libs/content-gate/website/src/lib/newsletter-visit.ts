import { ContentGateNewsletterParam } from '@wepublish/website/api';

export const NEWSLETTER_VISIT_KEY = 'content-gate-newsletter-visit';

export function detectNewsletterVisit(
  params: Pick<ContentGateNewsletterParam, 'key' | 'value'>[],
  search: string
) {
  if (!params.length) {
    return false;
  }

  const searchParams = new URLSearchParams(search);
  const fromNewsletter = params.some(
    ({ key, value }) => searchParams.get(key) === value
  );

  if (fromNewsletter) {
    sessionStorage.setItem(NEWSLETTER_VISIT_KEY, 'true');

    return true;
  }

  return sessionStorage.getItem(NEWSLETTER_VISIT_KEY) === 'true';
}
