import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { WepBlockStyles } from './components/block-styles/wep-block-styles';
import { WepBreakBlock } from './components/break-blocks/wep-break-block';
import { WepBaseTeaserSlots } from './components/teaser-layouts/wep-base-teaser-slots';
import { WepBaseTeaser } from './components/teasers/wep-base-teaser';
import { WepArticle } from './components/wep-article';
import { WepBlockRenderer } from './components/wep-block-renderer';
import { WepContentWrapper } from './components/wep-content-wrapper';
import { WepFooter } from './components/wep-footer';
import { WepLink } from './components/wep-link';
import { WepNavbar } from './components/wep-navbar';
import { WepPage } from './components/wep-page';
import { WepQuoteBlock } from './components/wep-quote-block';
import { WepTenantGlobalStyles } from './components/wep-tenant-global-styles';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const wepublishSiteTenant: WebsiteTenantConfig = {
  id: 'wepublish-site',
  name: 'We.Publish Website',
  createTheme: () => theme,
  builder: {
    Footer: WepFooter,
    Navbar: WepNavbar,
    ContentWrapper: WepContentWrapper,
    Article: WepArticle,
    Page: WepPage,
    blocks: {
      Renderer: WepBlockRenderer,
      BaseTeaser: WepBaseTeaser,
      TeaserSlots: WepBaseTeaserSlots,
      Quote: WepQuoteBlock,
      Break: WepBreakBlock,
    },
    elements: { Link: WepLink },
    date: { format: dateFormatter },
    meta: { siteTitle: 'We.Publish' },
  },
  blockStyles: Object.values(WepBlockStyles),
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
  GlobalStyles: WepTenantGlobalStyles,
};
