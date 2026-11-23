import { SitemapPageFragment } from '@wepublish/website/api';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sitemapConfig } from './sitemap';

const page = (slug: string): SitemapPageFragment => ({
  __typename: 'Page',
  id: slug,
  slug,
  url: `https://bajour.ch/${slug}`,
  publishedAt: '2026-11-01T00:00:00.000Z',
  latest: { __typename: 'PageRevision', publishedAt: null },
});

// Every `source: '/slug'` redirect in next.config.js
const redirectedSlugs = () =>
  [
    ...readFileSync(join(__dirname, '..', 'next.config.js'), 'utf8').matchAll(
      /source:\s*'\/([^'/]+)'/g
    ),
  ].map(([, slug]) => slug);

describe('bajour sitemap', () => {
  it('leaves out the pages next.config.js redirects elsewhere', () => {
    const slugs = redirectedSlugs();

    expect(slugs).toEqual(
      expect.arrayContaining(['spende', 'unterstuetzen', 'member-uebersicht'])
    );
    for (const slug of slugs) {
      expect(sitemapConfig.filterPage?.(page(slug))).toBe(false);
    }
  });

  it('keeps every other page', () => {
    expect(sitemapConfig.filterPage?.(page('impressum'))).toBe(true);
  });
});
