import { createLlmsTxtHandler } from '@wepublish/feed/website';

import { sitemapConfig } from '../../src/sitemap';

export const config = {
  regions: ['all'],
};

export default createLlmsTxtHandler(sitemapConfig);
