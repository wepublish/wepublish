import { Theme } from '@emotion/react';
import { PuckComponent } from '@puckeditor/core';

import {
  breakpointsStyles,
  BreakpointsValue,
} from '@wepublish/puck-content/editor';

export type SpaceSize = { size?: number };
export type SpaceProps = { size: BreakpointsValue<SpaceSize> };

export const SpaceRender: PuckComponent<SpaceProps> = ({ size, ...props }) => (
  <div
    css={(theme: Theme) =>
      breakpointsStyles(theme, size, resolved => ({
        height: resolved?.size ?? 0,
      }))
    }
    ref={props.puck.dragRef}
  />
);
