import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { FazettenBlockStyles } from './components/block-styles/fazetten-block-styles';
import { FazettenArticle } from './components/fazetten-article';
import { FazettenTitleBlock } from './components/fazetten-title-block';
import { FazettenBaseTeaserSlots } from './components/teaser-layouts/fazetten-base-teaser-slots';
import { FazettenAlternatingTeaser } from './components/teasers/fazetten-alternating-teaser';
import { FazettenBaseTeaser } from './components/teasers/fazetten-base-teaser';
import deOverriden from './locales/deOverriden.json';
import theme, { FazettenGlobalStyles } from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const fazettenTenant: WebsiteTenantConfig = {
  id: 'fazetten',
  name: 'Fazetten',
  createTheme: () => theme,
  builder: {
    elements: { Link: NextWepublishLink },
    blocks: {
      Title: FazettenTitleBlock,
      TeaserSlots: FazettenBaseTeaserSlots,
      BaseTeaser: FazettenBaseTeaser,
    },
    blockStyles: { AlternatingTeaser: FazettenAlternatingTeaser },
    date: { format: dateFormatter },
    Article: FazettenArticle,
    meta: { siteTitle: 'Fazetten' },
  },
  blockStyles: Object.values(FazettenBlockStyles),
  translations: {
    lng: 'de',
    overrides: { de: deOverriden },
  },
  dateLocale: de,
  GlobalStyles: FazettenGlobalStyles,
};
