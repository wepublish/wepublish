import { Theme, useTheme } from '@mui/material';
import { PuckComponent, Slot } from '@puckeditor/core';
import { Slider } from '@wepublish/block-content/website';
import {
  BuilderSlideGap,
  BuilderSlidesPerView,
} from '@wepublish/website/builder';

import {
  BreakpointsValue,
  resolveBreakpointValue,
  useOverlayPortalOnModifier,
} from '@wepublish/puck-content/editor';

export type SliderItem = {
  content: Slot;
};

export type SliderSettings = {
  perView?: number;
  gap?: number;
};

export type SliderProps = {
  className?: string;
  items: SliderItem[];
  settings: BreakpointsValue<SliderSettings>;
  dragDisabled?: boolean;
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

export const SliderRender: PuckComponent<SliderProps> = ({
  items,
  settings,
  dragDisabled,
  ...props
}) => {
  const theme = useTheme();

  const controlRef = useOverlayPortalOnModifier();

  return (
    <Slider
      {...toSliderConfig(theme, settings ?? {})}
      dragDisabled={true}
      refs={{ control: controlRef }}
      origin={'auto'}
      loop={false}
      {...props}
    >
      {items.map(({ content: Content }, index) => (
        <Content
          key={index}
          minEmptyHeight={200}
          collisionAxis="dynamic"
        />
      ))}
    </Slider>
  );
};
