import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { OnlineReportsArticle } from './components/article';
import { OnlineReportsAuthorChip } from './components/author-chip';
import { OnlineReportsFooter } from './components/footer';
import { OnlineReportsArticleAuthors } from './components/online-reports-article-authors';
import { OnlineReportsArticleList } from './components/online-reports-article-list';
import { OnlineReportsCommentListItem } from './components/online-reports-comment-list-item';
import { OnlineReportsSubscribe } from './components/onlinereports-subscribe';
import { OnlineReportsPage } from './components/page';
import { OnlineReportsPaymentAmount } from './components/payment-amount';
import { OnlineReportsQuoteBlock } from './components/quote-block';
import { OnlineReportsTitleBlock } from './components/title-block';
import { AdsProvider } from './context/ads-context';
import { OnlineReportsRegistrationForm } from './forms/registration-form';
import deOverridden from './locales/deOverridden.json';
import { OnlineReportsNavbar } from './navigation/onlinereports-navbar';
import { OnlineReportsBlockRenderer } from './onlinereports-block-renderer';
import { OnlineReportsGlobalStyles } from './onlinereports-global-styles';
import { OnlineReportsTeaser } from './onlinereports-teaser';
import { OnlineReportsTeaserGridBlock } from './onlinereports-teaser-grid-block';
import { OnlineReportsTeaserGridFlexBlock } from './onlinereports-teaser-grid-flex-blocks';
import { OnlineReportsTeaserListBlock } from './onlinereports-teaser-list-block';
import { OnlineReportsRenderElement } from './render-element';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const onlinereportsTenant: WebsiteTenantConfig = {
  id: 'onlinereports',
  name: 'OnlineReports',
  createTheme: () => theme,
  builder: {
    AuthorChip: OnlineReportsAuthorChip,
    ArticleAuthors: OnlineReportsArticleAuthors,
    ArticleList: OnlineReportsArticleList,
    Navbar: OnlineReportsNavbar,
    Footer: OnlineReportsFooter,
    Article: OnlineReportsArticle,
    CommentListItem: OnlineReportsCommentListItem,
    Page: OnlineReportsPage,
    RegistrationForm: OnlineReportsRegistrationForm,
    PaymentAmountPicker: OnlineReportsPaymentAmount,
    richtext: { RenderElement: OnlineReportsRenderElement },
    elements: { Link: NextWepublishLink },
    blocks: {
      BaseTeaser: OnlineReportsTeaser,
      Renderer: OnlineReportsBlockRenderer,
      TeaserList: OnlineReportsTeaserListBlock,
      TeaserGridFlex: OnlineReportsTeaserGridFlexBlock,
      TeaserGrid: OnlineReportsTeaserGridBlock,
      Quote: OnlineReportsQuoteBlock,
      Title: OnlineReportsTitleBlock,
      Subscribe: OnlineReportsSubscribe,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'OnlineReports' },
  },
  blockStyles: [
    'Highlight',
    'News',
    'RuckSpiegel',
    'Gelesen und Gedacht',
    'Aktuelle Bild',
  ],
  translations: {
    lng: 'de',
    overrides: { de: deOverridden },
  },
  dateLocale: de,
  GlobalStyles: OnlineReportsGlobalStyles,
  Wrapper: AdsProvider,
};
