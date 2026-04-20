import { AlternatingTeaser } from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';

import { AlternatingTeaserTheme } from '../theme';

export const FazettenAlternatingTeaser = createWithTheme(
  AlternatingTeaser,
  AlternatingTeaserTheme
);
