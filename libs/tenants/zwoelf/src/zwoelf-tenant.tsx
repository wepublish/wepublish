import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { zwoelfConfig } from './zwoelf-config';

/**
 * The Next flavour: `zwoelfConfig` plus the one thing a non-Next app cannot
 * bundle. Derived rather than duplicated so the two cannot drift.
 */
export const zwoelfTenant: WebsiteTenantConfig = {
  ...zwoelfConfig,
  builder: {
    ...zwoelfConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
