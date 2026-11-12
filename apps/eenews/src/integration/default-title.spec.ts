import {
  EENEWS_DOSSIER_INDEX_TITLE,
  eenewsConfig,
} from '@wepublish/tenant/eenews';

import { Route as TagIndex } from '../routes/a/tag/index';
import { Route as Tag } from '../routes/a/tag/$tag';
import { Route as Deactivated } from '../routes/profile/subscription/deactivated';
import { Route as Subscription } from '../routes/profile/subscription/$id';

/**
 * Next's `_app.tsx` gave every page the site title; routes without an SEO
 * component must set it themselves (see `defaultHead`), or the page ships
 * without any `<title>`.
 */
describe('routes without an SEO component', () => {
  it.each([
    ['/profile/subscription/$id', Subscription],
    ['/profile/subscription/deactivated', Deactivated],
  ])('%s carries the site title', (_, route) => {
    const head = (route.options as { head?: () => { meta?: object[] } }).head;

    expect(head?.().meta).toContainEqual({
      title: eenewsConfig.builder.meta?.siteTitle,
    });
  });

  it('/a/tag/ is titled as the dossier overview', () => {
    const head = (TagIndex.options as { head?: () => { meta?: object[] } })
      .head;

    expect(head?.().meta).toContainEqual({ title: EENEWS_DOSSIER_INDEX_TITLE });
  });

  /**
   * `EenewsTagPage` renders `TagSEO` ("ee-news - Thema «…»" etc.). A route-level
   * title would come first in <head> and win, since browsers take the first.
   */
  it('/a/tag/$tag leaves the title to TagSEO', () => {
    const head = (Tag.options as { head?: () => { meta?: object[] } }).head;

    expect(head?.().meta ?? []).not.toContainEqual(
      expect.objectContaining({ title: expect.anything() })
    );
  });
});
