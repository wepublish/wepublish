import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { TsriArticleMeta } from './components/tsri-article-meta';
import { TsriBreakBlock } from './components/tsri-break-block';
import { TsriContextBox } from './components/tsri-context-box';
import { TsriNavbar } from './components/tsri-navbar';
import { TsriQuoteBlock } from './components/tsri-quote-block';
import { TsriRichText } from './components/tsri-richtext';
import { TsriTeaser } from './components/tsri-teaser';
import { WntiPaymentAmountPicker } from './components/wnti-payment-amount-picker';
import { WntiTitleBlock } from './components/wnti-title-block';
import deOverriden from './locales/deOverriden.json';
import theme, { WntiGlobalStyles } from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

/**
 * The tenant config without `elements.Link`.
 *
 * `wnti-tenant.tsx` binds `NextWepublishLink`, which imports `next/link` and so
 * cannot be bundled by a non-Next app. The TanStack app supplies its own
 * router-aware `Link`; everything else is identical.
 */
export const wntiConfig: WebsiteTenantConfig = {
  id: 'wnti',
  name: 'WNTI',
  GlobalStyles: WntiGlobalStyles,
  createTheme: () => theme,
  builder: {
    Navbar: TsriNavbar,
    ArticleMeta: TsriArticleMeta,
    PaymentAmountPicker: WntiPaymentAmountPicker,
    blocks: {
      BaseTeaser: TsriTeaser,
      Break: TsriBreakBlock,
      Quote: TsriQuoteBlock,
      RichText: TsriRichText,
      Title: WntiTitleBlock,
    },
    blockStyles: {
      ContextBox: TsriContextBox,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'WNTI' },
  },
  blockStyles: ['ContextBox'],
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
};
