import { createSitemapHandlers } from '@wepublish/website/server';

import { sitemapConfig } from '../../../src/sitemap';

export const config = {
  regions: ['all'],
};

export default createSitemapHandlers(sitemapConfig).sitemapChunk;
