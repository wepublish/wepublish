import { CSSObject, Theme } from '@emotion/react';

import { isHiddenOn } from '../values/visibility';
import { BlockVisibility } from './graphql-shape';

export const visibilityCss = (
  theme: Theme,
  visibility: BlockVisibility | null | undefined
): CSSObject =>
  Object.fromEntries(
    theme.breakpoints.keys
      .filter(breakpoint => isHiddenOn(visibility?.breakpoints, breakpoint))
      .map(breakpoint => [
        theme.breakpoints.only(breakpoint),
        { display: 'none' },
      ])
  );
