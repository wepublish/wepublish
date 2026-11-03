import { CSSObject, Theme } from '@emotion/react';

import { GapValue } from '../../values/gap';
import { spacingToCss } from '../../values/spacing';

export type GapLayout = {
  gap?: GapValue;
};

export const gapStyles = (
  theme: Theme,
  layout: GapLayout | undefined
): CSSObject => ({
  rowGap: spacingToCss(theme, layout?.gap?.row),
  columnGap: spacingToCss(theme, layout?.gap?.column),
});
