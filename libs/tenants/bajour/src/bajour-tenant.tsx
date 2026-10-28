import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { BajourArticleDateWithShare } from './bajour-article-date-with-share';
import { BajourTitleBlock } from './components/bajour-title-block';
import { BriefingType } from './components/briefing/is-briefing';
import { BajourBanner } from './components/website-builder-overwrites/banner/bajour-banner';
import { BajourBlockRenderer } from './components/website-builder-overwrites/block-renderer/block-renderer';
import { BajourTeaser } from './components/website-builder-overwrites/blocks/teaser';
import { BajourTeaserSlider } from './components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider';
import { BajourBreakBlock } from './components/website-builder-overwrites/break/bajour-break';
import { BajourContextBox } from './components/website-builder-overwrites/context-box/context-box';
import { BajourQuoteBlock } from './components/website-builder-overwrites/quote/bajour-quote';
import {
  BajourTeaserGrid,
  BajourTeaserList,
} from './components/website-builder-styled/blocks/teaser-grid-styled';
import theme from './styles/theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const bajourTenant: WebsiteTenantConfig = {
  id: 'bajour',
  name: 'Bajour',
  createTheme: () => theme,
  builder: {
    meta: { siteTitle: 'Bajour' },
    elements: { Link: NextWepublishLink },
    date: { format: dateFormatter },
    blocks: {
      Renderer: BajourBlockRenderer,
      BaseTeaser: BajourTeaser,
      TeaserGrid: BajourTeaserGrid,
      TeaserList: BajourTeaserList,
      Break: BajourBreakBlock,
      Quote: BajourQuoteBlock,
      Title: BajourTitleBlock,
    },
    blockStyles: {
      ContextBox: BajourContextBox,
      TeaserSlider: BajourTeaserSlider,
    },
    ArticleDate: BajourArticleDateWithShare,
    Banner: BajourBanner,
  },
  blockStyles: [
    'FrageDesTages',
    'SearchSlider',
    'BestOfWePublish',
    ...Object.values(BriefingType),
    'Archive',
    'Breite Teaser',
    'Kleine Teaser',
    'Light',
    'Sponsored',
    'News',
  ],
  translations: { lng: 'de' },
  dateLocale: de,
};
