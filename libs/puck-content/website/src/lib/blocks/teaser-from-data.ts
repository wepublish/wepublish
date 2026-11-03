import { FullTeaserFragment, TeaserType } from '@wepublish/website/api';

import { PuckBlockData } from './block.types';
import { PuckDatasources } from './graphql-shape';

export const teaserSlotModels = ['article', 'page', 'event'] as const;

export type TeaserSlotModel = (typeof teaserSlotModels)[number];

const providingTypes: readonly string[] = ['slot', 'single'];

export const teaserSlotModel = (
  datasources: PuckDatasources | null | undefined
): TeaserSlotModel | undefined =>
  teaserSlotModels.find(model => {
    const type = datasources?.[model]?.type;

    return !!type && providingTypes.includes(type);
  });

const withoutOverrides = {
  preTitle: null,
  title: null,
  lead: null,
  image: null,
};

export const teaserFromData = (
  model: TeaserSlotModel,
  data: PuckBlockData
): FullTeaserFragment | null => {
  switch (model) {
    case 'article': {
      const article = data.articles?.[0];

      return article ?
          {
            __typename: 'ArticleTeaser',
            type: TeaserType.Article,
            ...withoutOverrides,
            article,
          }
        : null;
    }

    case 'page': {
      const page = data.pages?.[0];

      return page ?
          {
            __typename: 'PageTeaser',
            type: TeaserType.Page,
            ...withoutOverrides,
            page,
          }
        : null;
    }

    case 'event': {
      const event = data.events?.[0];

      return event ?
          {
            __typename: 'EventTeaser',
            type: TeaserType.Event,
            ...withoutOverrides,
            event,
          }
        : null;
    }
  }
};
