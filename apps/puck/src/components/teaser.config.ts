import { ComponentConfig } from '@measured/puck';
import { TeaserItem } from './teaser.render';
import { ComponentProps, memo } from 'react';
import { articleField } from '../fields/article';
import { pageField } from '../fields/page';
import { eventField } from '../fields/event';
import { TeaserType } from '@wepublish/website/api';

export const TeaserConfig: ComponentConfig<ComponentProps<typeof TeaserItem>> =
  {
    fields: {
      type: {
        type: 'radio',
        options: [
          { label: TeaserType.Article, value: TeaserType.Article },
          { label: TeaserType.Page, value: TeaserType.Page },
          { label: TeaserType.Event, value: TeaserType.Event },
          { label: TeaserType.Custom, value: TeaserType.Custom },
        ],
      },
      page: pageField,
      event: eventField,
      article: articleField,
    },
    resolveFields: (data, params) => {
      switch (data.props.type) {
        case TeaserType.Article: {
          const { page, event, ...fields } = params.fields;

          return fields;
        }

        case TeaserType.Page: {
          const { article, event, ...fields } = params.fields;

          return fields;
        }

        case TeaserType.Event: {
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
    render: memo(TeaserItem),
    defaultProps: {
      type: TeaserType.Article,
    },
  };
