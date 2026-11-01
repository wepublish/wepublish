import { CSSObject, Theme } from '@emotion/react';

import { BlockVisibility } from './graphql-shape';
import {
  breakpointStylingToCss,
  BreakpointStylingToCssOptions,
  PuckBreakpointStyling,
} from './styling-to-css';
import { visibilityCss } from './visibility-css';

export type PuckBlockCssInput = {
  styling?: PuckBreakpointStyling | null;
  visibility?: BlockVisibility | null;
};

const isCssObject = (value: unknown): value is CSSObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeCss = (base: CSSObject, extra: CSSObject): CSSObject =>
  Object.fromEntries([
    ...Object.entries(base),
    ...Object.entries(extra).map(([key, value]) => {
      const existing = base[key];

      return [
        key,
        isCssObject(existing) && isCssObject(value) ?
          { ...existing, ...value }
        : value,
      ];
    }),
  ]);

export const puckBlockCss = (
  theme: Theme,
  { styling, visibility }: PuckBlockCssInput,
  options?: BreakpointStylingToCssOptions
): CSSObject =>
  mergeCss(
    breakpointStylingToCss(theme, styling, options),
    visibilityCss(theme, visibility)
  );
