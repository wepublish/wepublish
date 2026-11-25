import {
  formatInSiteTimeZone,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { de } from 'date-fns/locale';

import { CulturBreakBlock } from './components/cultur-break';
import { CulturNavbar } from './components/cultur-navbar';
import { CulturTeaser } from './components/cultur-teaser';
import { Footer } from './components/footer';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${formatInSiteTimeZone(date, 'dd. MMMM yyyy', { locale: de })} um ${formatInSiteTimeZone(date, 'HH:mm', { locale: de })}`
  : formatInSiteTimeZone(date, 'dd. MMMM yyyy', { locale: de });

/**
 * The tenant config without `elements.Link`.
 *
 * `cultur-tenant.tsx` binds `NextWepublishLink`, which imports `next/link` and so
 * cannot be bundled by a non-Next app. The TanStack app supplies its own
 * router-aware `Link`; everything else is identical.
 */
export const culturConfig: WebsiteTenantConfig = {
  id: 'cultur',
  name: 'Cültür',
  createTheme: () => theme,
  builder: {
    Footer,
    Navbar: CulturNavbar,
    blocks: {
      BaseTeaser: CulturTeaser,
      Break: CulturBreakBlock,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Cültür' },
  },
  translations: { lng: 'de' },
  dateLocale: de,
};
