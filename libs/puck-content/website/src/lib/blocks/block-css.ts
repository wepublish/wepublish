import { CSSObject, Theme } from '@emotion/react';

import { BlockVisibility } from './graphql-shape';
import {
  PuckBlockStylingLike,
  stylingToCss,
  StylingToCssOptions,
} from './styling-to-css';
import { visibilityCss } from './visibility-css';

export type PuckBlockCssInput = {
  styling?: PuckBlockStylingLike | null;
  visibility?: BlockVisibility | null;
};

export const puckBlockCss = (
  theme: Theme,
  { styling, visibility }: PuckBlockCssInput,
  options?: StylingToCssOptions
): CSSObject => ({
  ...stylingToCss(theme, styling, options),
  ...visibilityCss(theme, visibility),
});
