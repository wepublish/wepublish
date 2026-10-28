import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { MannschaftArticle } from './mannschaft-article';
import { MannschaftArticleDateWithShare } from './mannschaft-article-date-with-share';
import { MannschaftBlockRenderer } from './mannschaft-block-renderer';
import { MannschaftBlocks } from './mannschaft-blocks';
import { MannschaftBreakBlock } from './mannschaft-break-block';
import { MannschaftFocusTeaser } from './mannschaft-focus-teaser';
import { MannschaftGlobalStyles } from './mannschaft-global-styles';
import { MannschaftPage } from './mannschaft-page';
import { MannschaftRichtextBlock } from './mannschaft-richtext-block';
import { MannschaftTeaser } from './mannschaft-teaser';
import { MannschaftTeaserGrid } from './mannschaft-teaser-grid';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const mannschaftTenant: WebsiteTenantConfig = {
  id: 'mannschaft',
  name: 'Mannschaft',
  createTheme: () => theme,
  builder: {
    Page: MannschaftPage,
    Article: MannschaftArticle,
    ArticleDate: MannschaftArticleDateWithShare,
    elements: { Link: NextWepublishLink },
    blocks: {
      Blocks: MannschaftBlocks,
      Renderer: MannschaftBlockRenderer,
      BaseTeaser: MannschaftTeaser,
      TeaserGrid: MannschaftTeaserGrid,
      Break: MannschaftBreakBlock,
      RichText: MannschaftRichtextBlock,
    },
    blockStyles: {
      FocusTeaser: MannschaftFocusTeaser,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Mannschaft' },
  },
  blockStyles: [
    'Primary Bg',
    'Schwarz Bg',
    'Secondary Bg',
    'Pink Bg',
    'Accent Bg',
    'Türkis Bg',
    'Light Accent Bg',
    'Gelb Bg',
    'Violett Bg',
    'Lila Bg',
    'Warning Bg',
    'Orange Bg',
    'Error Bg',
    'Rot Bg',
    'Success Bg',
    'Grün Bg',
    'Info Bg',
    'Blau Bg',
    'ContentBox',
    '1st Teaser Ad',
    '2nd Teaser Ad',
    '3rd Teaser Ad',
    'Highlight',
    'Hot & Trending',
    'Focus',
    'Slider',
  ],
  translations: { lng: 'de' },
  dateLocale: de,
  GlobalStyles: MannschaftGlobalStyles,
};
