import { NextWepublishLink } from '@wepublish/utils/website/link';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { BabanewsBlockRenderer } from './components/website-builder-overwrites/block-renderer/block-renderer';
import { BabanewsBanner } from './components/website-builder-overwrites/blocks/banner';
import { BabanewsTeaserGrid } from './components/website-builder-styled/blocks/teaser-grid-styled';
import theme from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: de })} um ${format(date, 'HH:mm', { locale: de })}`
  : format(date, 'dd. MMMM yyyy', { locale: de });

export const babanewsTenant: WebsiteTenantConfig = {
  id: 'babanews',
  name: 'baba news',
  createTheme: () => theme,
  builder: {
    elements: { Link: NextWepublishLink },
    date: { format: dateFormatter },
    blocks: {
      Renderer: BabanewsBlockRenderer,
      TeaserGrid: BabanewsTeaserGrid,
    },
    blockStyles: {
      Banner: BabanewsBanner,
    },
    meta: { siteTitle: 'baba news' },
  },
  blockStyles: ['Instagram'],
  translations: { lng: 'de' },
  dateLocale: de,
};
