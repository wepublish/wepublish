import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { fazettenConfig } from './fazetten-config';

/**
 * The Next flavour of the tenant config: `fazettenConfig` plus the one thing a
 * non-Next app cannot bundle, `NextWepublishLink` (it imports `next/link`).
 *
 * Derived rather than duplicated so the two cannot drift while both apps
 * exist; the TanStack app supplies its own router-aware `Link`.
 */
export const fazettenTenant: WebsiteTenantConfig = {
  ...fazettenConfig,
  builder: {
    ...fazettenConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
