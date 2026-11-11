import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { EenewsBlockRenderer } from './components/block-renderer/eenews-block-renderer';
import { EeNewsBlockType } from './components/block-styles/eenews-block-styles';
import { EenewsBreakBlock } from './components/blocks/eenews-break-block';
import { EenewsTeaserGrid } from './components/blocks/eenews-teaser-grid';
import { EenewsArticle } from './components/eenews-article';
import { EenewsAuthor } from './components/eenews-author';
import { EenewsAuthorListItem } from './components/eenews-author-list-item';
import { EenewsBuilderPagination } from './components/eenews-builder-pagination';
import { EenewsContentWrapper } from './components/eenews-content-wrapper';
import { EenewsFooter } from './components/eenews-footer';
import { EenewsGlobalStyles } from './components/eenews-global-styles';
import { EenewsInvoiceListItem } from './components/eenews-invoice-list-item';
import { EeNewsMemberPlanPicker } from './components/eenews-memberplan-picker';
import { EeNewsMemberPlanItem } from './components/eenews-memberplan-picker-item';
import { EenewsNavbar } from './components/eenews-navbar';
import { EenewsSubscriptionListItem } from './components/eenews-subscription-list-item';
import { EenewsTagPage } from './components/eenews-tag-page';
import { EenewsTeaser } from './components/teasers/eenews-teaser';
import { AdsProvider } from './context/ads-context';
import deOverridden from './locales/deOverridden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const eenewsTenant: WebsiteTenantConfig = {
  id: 'eenews',
  name: 'ee-news',
  createTheme: () => theme,
  builder: {
    Navbar: EenewsNavbar,
    Footer: EenewsFooter,
    Article: EenewsArticle,
    Tag: EenewsTagPage,
    Author: EenewsAuthor,
    AuthorListItem: EenewsAuthorListItem,
    MemberPlanItem: EeNewsMemberPlanItem,
    MemberPlanPicker: EeNewsMemberPlanPicker,
    SubscriptionListItem: EenewsSubscriptionListItem,
    InvoiceListItem: EenewsInvoiceListItem,
    ContentWrapper: EenewsContentWrapper,
    blocks: {
      Renderer: EenewsBlockRenderer,
      Teaser: EenewsTeaser,
      TeaserGrid: EenewsTeaserGrid,
      Break: EenewsBreakBlock,
    },
    elements: {
      Link: NextWepublishLink,
      Pagination: EenewsBuilderPagination,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'ee-news.ch' },
  },
  blockStyles: Object.values(EeNewsBlockType),
  translations: {
    lng: 'de',
    overrides: { de: deOverridden },
  },
  dateLocale: de,
  GlobalStyles: EenewsGlobalStyles,
  Wrapper: AdsProvider,
};
