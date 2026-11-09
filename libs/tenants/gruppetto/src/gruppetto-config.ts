import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { GruppettoBreakBlock } from './components/gruppetto-break-block';
import { GruppettoFooter } from './components/gruppetto-footer';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

export const gruppettoConfig: WebsiteTenantConfig = {
  id: 'gruppetto',
  name: 'Gruppetto',
  createTheme: () => theme,
  builder: {
    Footer: GruppettoFooter,
    blocks: { Break: GruppettoBreakBlock },
    meta: { siteTitle: 'Gruppetto - Das neue Schweizer Radsportmagazin' },
  },
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
