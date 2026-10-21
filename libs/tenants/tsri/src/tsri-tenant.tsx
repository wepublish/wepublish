import {
  BuilderBlockRendererProps,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { uniq } from 'ramda';
import { ComponentType } from 'react';

import { TsriFlexBlock } from './components/block-layouts/tsri-base-flex-block';
import { TsriTabbedContentType } from './components/block-layouts/tsri-base-tabbed-content';
import {
  TsriBreakBlock,
  TsriBreakBlockType,
} from './components/break-blocks/tsri-base-break-block';
import { TsriContextBox } from './components/break-blocks/tsri-context-box';
import { TsriRenderElement } from './components/richtext/tsri-render-element';
import { TsriBaseTeaserSlots } from './components/teaser-layouts/tsri-base-teaser-slots';
import { TsriLayoutType } from './components/teaser-layouts/tsri-layout';
import {
  TsriBaseTeaser,
  TsriTeaserType,
} from './components/teasers/tsri-base-teaser';
import { TsriArticle } from './components/tsri-article';
import { TsriArticleAuthor } from './components/tsri-article-author';
import { TsriArticleAuthors } from './components/tsri-article-authors';
import { TsriArticleDate } from './components/tsri-article-date';
import { TsriArticleList } from './components/tsri-article-list';
import { TsriArticleMeta } from './components/tsri-article-meta';
import { TsriAuthor } from './components/tsri-author';
import { TsriAuthorChip } from './components/tsri-author-chip';
import { TsriAuthorLinks } from './components/tsri-author-links';
import { TsriAuthorList } from './components/tsri-author-list';
import { TsriAuthorListItem } from './components/tsri-author-list-item';
import { TsriBanner } from './components/tsri-banner';
import { TsriBildwurfAdBlock } from './components/tsri-bildwurf-ad-block';
import {
  TsriBlockRenderer,
  TsriBlocks,
} from './components/tsri-block-renderer';
import { TsriCommentList } from './components/tsri-comment-list';
import { TsriEvent } from './components/tsri-event';
import {
  TsriEventListItem,
  TsriEventListView,
} from './components/tsri-event-list-item';
import { TsriFooter } from './components/tsri-footer';
import { TsriGlobalStyles } from './components/tsri-global-styles';
import { TsriImageSlider } from './components/tsri-image-slider';
import { TsriNextWepublishLink } from './components/tsri-next-wepublish-link';
import { TsriPage } from './components/tsri-page';
import { TsriPaymentAmountPicker } from './components/tsri-payment-amount-picker';
import { TsriQuoteBlock } from './components/tsri-quote-block';
import { TsriRichText } from './components/tsri-richtext';
import { TsriTag } from './components/tsri-tag';
import { TsriTextToIcon } from './components/tsri-text-to-icon';
import { TsriTitleBlock } from './components/tsri-title-block';
import { TsriV2Navbar } from './components/tsri-v2-navbar';
import deOverriden from './locales/deOverriden.json';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} | ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const tsriTenant: WebsiteTenantConfig = {
  id: 'tsri',
  name: 'Tsüri',
  createTheme: () => theme,
  builder: {
    Footer: TsriFooter,
    Navbar: TsriV2Navbar,
    Article: TsriArticle,
    Page: TsriPage,
    Event: TsriEvent,
    EventList: TsriEventListView,
    EventListItem: TsriEventListItem,
    AuthorChip: TsriAuthorChip,
    ArticleDate: TsriArticleDate,
    ArticleMeta: TsriArticleMeta,
    ArticleList: TsriArticleList,
    PaymentAmountPicker: TsriPaymentAmountPicker,
    ArticleAuthor: TsriArticleAuthor,
    ArticleAuthors: TsriArticleAuthors,
    Author: TsriAuthor,
    AuthorLinks: TsriAuthorLinks,
    AuthorList: TsriAuthorList,
    AuthorListItem: TsriAuthorListItem,
    TextToIcon: TsriTextToIcon,
    Tag: TsriTag,
    CommentList: TsriCommentList,
    Banner: TsriBanner,
    elements: { Link: TsriNextWepublishLink },
    richtext: { RenderElement: TsriRenderElement },
    blocks: {
      BaseTeaser: TsriBaseTeaser,
      TeaserSlots: TsriBaseTeaserSlots,
      Break: TsriBreakBlock,
      Quote: TsriQuoteBlock,
      RichText: TsriRichText,
      Title: TsriTitleBlock,
      Renderer: TsriBlockRenderer as ComponentType<BuilderBlockRendererProps>,
      Blocks: TsriBlocks,
      FlexBlock: TsriFlexBlock,
      BildwurfAd: TsriBildwurfAdBlock,
    },
    blockStyles: {
      ContextBox: TsriContextBox,
      ImageSlider: TsriImageSlider,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Tsri' },
  },
  blockStyles: uniq([
    ...Object.values(TsriLayoutType),
    ...Object.values(TsriTeaserType),
    ...Object.values(TsriBreakBlockType),
    ...Object.values(TsriTabbedContentType),
  ]),
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
  GlobalStyles: TsriGlobalStyles,
};
