import { ComponentConfig } from '@measured/puck';
import { TeaserList } from './teaser-list.render';
import { ComponentProps, memo } from 'react';
import { TeaserType } from '@wepublish/website/api';

export const TeaserListConfig: ComponentConfig<
  ComponentProps<typeof TeaserList>
> = {
  fields: {
    type: {
      type: 'radio',
      options: [
        { label: TeaserType.Article, value: TeaserType.Article },
        { label: TeaserType.Page, value: TeaserType.Page },
        { label: TeaserType.Event, value: TeaserType.Event },
      ],
    },
    take: {
      type: 'number',
      min: 1,
      max: 100,
    },
    skip: {
      type: 'number',
      min: 0,
      max: 100,
    },
  },
  inline: true,
  render: memo(TeaserList),
  defaultProps: {
    type: TeaserType.Article,
    take: 6,
    skip: 0,
  },
};
