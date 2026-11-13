import { createFeedHandler } from '@wepublish/feed/website';

import { getFeed } from '../../src/feed';

export const config = {
  regions: ['all'],
  api: { bodyParser: false },
};

export default createFeedHandler(getFeed, 'rss2', {
  cacheControl: 'public, s-maxage=60',
  cdnCacheControl: 'public, s-maxage=60',
  vercelCdnCacheControl: 'public, s-maxage=3600',
});
