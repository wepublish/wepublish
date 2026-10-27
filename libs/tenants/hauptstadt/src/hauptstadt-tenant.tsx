import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { CenterTextBlockStyle } from './block-style/centter-text';
import { FontSizeProvider } from './components/font-size-picker';
import {
  HauptstadtArticle,
  HauptstadtArticleAuthors,
  HauptstadtArticleMeta,
} from './components/hauptstadt-article';
import { HauptstadtArticleDate } from './components/hauptstadt-article-date';
import { HauptstadtAuthorChip } from './components/hauptstadt-author-chip';
import { HauptstadtBanner } from './components/hauptstadt-banner';
import { HauptstadtBlockRenderer } from './components/hauptstadt-block-renderer';
import { HauptstadtBreakBlock } from './components/hauptstadt-break';
import { HauptstadtCommentList } from './components/hauptstadt-comment';
import { HauptstadtContentWrapper } from './components/hauptstadt-content-wrapper';
import { HauptstadtEvent } from './components/hauptstadt-event';
import {
  HauptstadtImageBlock,
  HauptstadtImageGalleryBlock,
} from './components/hauptstadt-image-block';
import { HauptstadtLightbox } from './components/hauptstadt-lightbox';
import { HauptstadtListicle } from './components/hauptstadt-listicle';
import {
  HauptstadtMemberPlanItem,
  HauptstadtMemberPlanPicker,
} from './components/hauptstadt-memberplan-picker';
import { HauptstadtNavbar } from './components/hauptstadt-navbar';
import { HauptstadtFooter } from './components/hauptstadt-navigation';
import { HauptstadtPage } from './components/hauptstadt-page';
import { HauptstadtPaymentMethodPicker } from './components/hauptstadt-payment-method-picker';
import { HauptstadtPaywall } from './components/hauptstadt-paywall';
import { HauptstadtQuoteBlock } from './components/hauptstadt-quote';
import { HauptstadtSubscribe } from './components/hauptstadt-subscribe';
import { HauptstadtSubscriptionListItem } from './components/hauptstadt-subscription-list-item';
import {
  HauptstadtAlternatingTeaser,
  HauptstadtFocusTeaser,
  HauptstadtTeaser,
  HauptstadtTeaserGrid,
  HauptstadtTeaserList,
  HauptstadtTeaserSlider,
  HauptstadtTeaserSlots,
} from './components/hauptstadt-teaser';
import { HauptstadtTitleBlock } from './components/hauptstadt-title-block';
import deOverriden from './locales/deOverriden.json';
import { HauptstadtPrintStyles } from './print-styles';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const hauptstadtTenant: WebsiteTenantConfig = {
  id: 'hauptstadt',
  name: 'Hauptstadt',
  createTheme: () => theme,
  builder: {
    elements: { Link: NextWepublishLink },
    Footer: HauptstadtFooter,
    Navbar: HauptstadtNavbar,
    ContentWrapper: HauptstadtContentWrapper,
    AuthorChip: HauptstadtAuthorChip,
    Page: HauptstadtPage,
    Article: HauptstadtArticle,
    ArticleAuthors: HauptstadtArticleAuthors,
    ArticleMeta: HauptstadtArticleMeta,
    ArticleDate: HauptstadtArticleDate,
    Event: HauptstadtEvent,
    Banner: HauptstadtBanner,
    Paywall: HauptstadtPaywall,
    MemberPlanPicker: HauptstadtMemberPlanPicker,
    MemberPlanItem: HauptstadtMemberPlanItem,
    CommentList: HauptstadtCommentList,
    SubscriptionListItem: HauptstadtSubscriptionListItem,
    PaymentMethodPicker: HauptstadtPaymentMethodPicker,
    blocks: {
      Renderer: HauptstadtBlockRenderer,
      Title: HauptstadtTitleBlock,
      Quote: HauptstadtQuoteBlock,
      BaseTeaser: HauptstadtTeaser,
      TeaserList: HauptstadtTeaserList,
      TeaserGrid: HauptstadtTeaserGrid,
      TeaserSlots: HauptstadtTeaserSlots,
      Image: HauptstadtImageBlock,
      ImageGallery: HauptstadtImageGalleryBlock,
      Break: HauptstadtBreakBlock,
      Listicle: HauptstadtListicle,
      Subscribe: HauptstadtSubscribe,
    },
    blockStyles: {
      FocusTeaser: HauptstadtFocusTeaser,
      AlternatingTeaser: HauptstadtAlternatingTeaser,
      TeaserSlider: HauptstadtTeaserSlider,
      Lightbox: HauptstadtLightbox,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Hauptstadt' },
  },
  blockStyles: [CenterTextBlockStyle],
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
  GlobalStyles: HauptstadtPrintStyles,
  Wrapper: FontSizeProvider,
};
