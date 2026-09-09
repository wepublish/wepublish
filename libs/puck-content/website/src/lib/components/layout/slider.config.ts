import { ComponentConfig } from '@puckeditor/core';
import { z } from 'zod/v4';

import {
  breakpointsFieldAi,
  switchFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { SliderItem, SliderProps, SliderRender } from './slider.component';

const defaultItem: SliderItem = {
  content: [],
};

export const Slider: ComponentConfig<{
  props: SliderProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A horizontal carousel that shows its items as slides the reader swipes or clicks through, with dots and arrows for navigation. Each entry in items is one slide with a content slot for nested components. settings controls per breakpoint how many slides are visible at once (perView, fractions such as 1.4 show a peek of the next slide) and the gap between slides in pixels. Use it to present a series of equally important items in limited space, e.g. cards, teasers or images.',
  },
  fields: {
    items: {
      type: 'array',
      label: 'Slides',
      min: 1,
      getItemSummary: (_item, index = 0) => `Slide ${index + 1}`,
      defaultItemProps: defaultItem,
      arrayFields: {
        content: {
          type: 'slot',
        },
      },
    },
    settings: {
      type: 'breakpoints',
      label: 'Settings',
      objectFields: {
        perView: {
          type: 'number',
          label: 'Slides per view',
          min: 1,
          step: 0.1,
        },
        gap: {
          type: 'number',
          label: 'Gap',
          min: 0,
        },
      },
      ai: breakpointsFieldAi({
        perView: z
          .number()
          .min(1)
          .describe(
            'Slides visible at once, fractions show a peek of the next slide'
          ),
        gap: z.number().min(0).describe('Gap between slides in pixels'),
      }),
    },
    dragDisabled: {
      type: 'switch',
      label: 'Disable dragging',
      ai: switchFieldAi(
        'Whether swiping and dragging through the slides is disabled so only the dots and arrows navigate.'
      ),
    },
  },
  defaultProps: {
    items: [defaultItem, defaultItem, defaultItem],
    settings: {
      xs: { perView: 1.4, gap: 16 },
      sm: { perView: 2, gap: 32 },
      lg: { perView: 3 },
    },
    dragDisabled: false,
  },
  render: SliderRender,
};
