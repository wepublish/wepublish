import { eenewsConfig } from '@wepublish/tenant/eenews';

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
    ['/a/tag/', TagIndex],
    ['/a/tag/$tag', Tag],
    ['/profile/subscription/$id', Subscription],
    ['/profile/subscription/deactivated', Deactivated],
  ])('%s carries the site title', (_, route) => {
    const head = (route.options as { head?: () => { meta?: object[] } }).head;

    expect(head?.().meta).toContainEqual({
      title: eenewsConfig.builder.meta?.siteTitle,
    });
  });
});
