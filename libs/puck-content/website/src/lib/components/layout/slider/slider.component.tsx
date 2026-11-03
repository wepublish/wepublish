import { Theme, useTheme } from '@mui/material';
import { Slider } from '@wepublish/block-content/website';
import {
  BuilderSlideGap,
  BuilderSlidesPerView,
} from '@wepublish/website/builder';
import { Fragment, RefCallback } from 'react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import {
  BreakpointsValue,
  resolveBreakpointValue,
} from '../../../values/breakpoints';
import { itemContentSlot } from '../item-slot';

export type SliderItem = {
  content: PuckSlotValue;
};

export type SliderSettings = {
  perView?: number;
  gap?: number;
};

export type SliderProps = {
  items: SliderItem[];
  settings: BreakpointsValue<SliderSettings>;
  dragDisabled?: boolean;
};

export type SliderExtra = {
  refs: { control?: RefCallback<HTMLDivElement> };
};

/**
 * Splits the per breakpoint settings into the two configs the slider expects.
 * The settings are mobile first, so every breakpoint resolves to the closest
 * smaller breakpoint that has a value. Breakpoints that resolve to nothing are
 * left unset so the slider defaults apply.
 */
const toSliderConfig = (
  theme: Theme,
  settings: BreakpointsValue<SliderSettings>
) => {
  const slidesPerViewConfig: BuilderSlidesPerView = {};
  const slideGapConfig: BuilderSlideGap = {};

  for (const breakpoint of theme.breakpoints.keys) {
    const value = resolveBreakpointValue(theme, settings, breakpoint);

    if (value?.perView != null) {
      slidesPerViewConfig[breakpoint] = value.perView;
    }

    if (value?.gap != null) {
      slideGapConfig[breakpoint] = value.gap;
    }
  }

  return { slidesPerViewConfig, slideGapConfig };
};

export const SliderRender: PuckBlockComponent<SliderProps, SliderExtra> = ({
  props: { items, settings, dragDisabled },
  slots,
  className,
  refs,
}) => {
  const theme = useTheme();

  return (
    <Slider
      {...toSliderConfig(theme, settings ?? {})}
      className={className}
      dragDisabled={!!dragDisabled}
      refs={refs}
      origin={'auto'}
      loop={false}
    >
      {items.map((_item, index) => (
        <Fragment key={index}>
          {getSlot(slots, itemContentSlot(index))()}
        </Fragment>
      ))}
    </Slider>
  );
};
