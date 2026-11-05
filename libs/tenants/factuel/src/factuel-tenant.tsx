import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';

import { factuelConfig } from './factuel-config';

export const factuelTenant: WebsiteTenantConfig = {
  ...factuelConfig,
  builder: {
    ...factuelConfig.builder,
    elements: { Link: NextWepublishLink },
  },
};
