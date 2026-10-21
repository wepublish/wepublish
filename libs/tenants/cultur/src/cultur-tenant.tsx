import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { CulturBreakBlock } from './components/cultur-break';
import { CulturNavbar } from './components/cultur-navbar';
import { CulturTeaser } from './components/cultur-teaser';
import { Footer } from './components/footer';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const culturTenant: WebsiteTenantConfig = {
  id: 'cultur',
  name: 'Cültür',
  createTheme: () => theme,
  builder: {
    Footer,
    Navbar: CulturNavbar,
    elements: { Link: NextWepublishLink },
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
