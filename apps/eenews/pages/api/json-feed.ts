import { createFeedHandler } from '@wepublish/feed/website';

import { getFeed } from '../../src/feed';

export const config = {
  regions: ['all'],
  api: { bodyParser: false },
};

export default createFeedHandler(getFeed, 'json1');
