import { ComponentConfig } from '@measured/puck';
import { TeaserItem } from './teaser.render';
import { ComponentProps } from 'react';
import { articleField } from '../fields/article';
import { pageField } from '../fields/page';
import { eventField } from '../fields/event';

export const TeaserConfig: ComponentConfig<ComponentProps<typeof TeaserItem>> =
  {
    fields: {
      type: {
        type: 'radio',
        options: [
          { label: 'Article', value: 'article' },
          { label: 'Page', value: 'page' },
          { label: 'Event', value: 'event' },
          { label: 'Custom', value: 'custom' },
        ],
      },
      page: pageField,
      event: eventField,
      article: articleField,
    },
    resolveFields: (data, params) => {
      switch (data.props.type) {
        case 'article': {
          const { page, event, ...fields } = params.fields;

          return fields;
        }

        case 'page': {
          const { article, event, ...fields } = params.fields;

          return fields;
        }

        case 'event': {
          const { page, article, ...fields } = params.fields;

          return fields;
        }

        default: {
          const { article, page, event, ...fields } = params.fields;

          return fields;
        }
      }

      return params.fields;
    },
    inline: true,
    render: TeaserItem,
    defaultProps: {
      type: 'article',
    },
  };
