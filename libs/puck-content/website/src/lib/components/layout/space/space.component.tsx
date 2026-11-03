import { Theme } from '@emotion/react';
import { useForkRef } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import {
  breakpointsStyles,
  BreakpointsValue,
} from '../../../values/breakpoints';

export type SpaceSize = { size?: number };
export type SpaceProps = { size: BreakpointsValue<SpaceSize> };

export const SpaceRender: PuckBlockComponent<SpaceProps> = ({
  props: { size },
  className,
  ref,
}) => {
  const rootRef = useForkRef(ref);

  return (
    <div
      className={className}
      css={(theme: Theme) =>
        breakpointsStyles(theme, size, resolved => ({
          height: resolved?.size ?? 0,
        }))
      }
      ref={rootRef}
    />
  );
};
