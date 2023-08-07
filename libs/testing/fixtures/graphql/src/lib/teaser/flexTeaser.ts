import {Exact, TeaserGridFlexBlock as TeaserGridFlexBlockType} from '@wepublish/website/api'
import {customTeaser} from './customTeaser'
import {articleTeaser} from './articleTeaser'
import {pageTeaser} from './pageTeaser'

export const flexTeaser: Exact<TeaserGridFlexBlockType> = {
  __typename: 'TeaserGridFlexBlock',
  flexTeasers: [
    {
      alignment: {
        x: 0,
        y: 0,
        w: 3,
        h: 4,
        __typename: 'FlexAlignment'
      },
      teaser: customTeaser,
      __typename: 'FlexTeaser'
    },
    {
      alignment: {
        x: 3,
        y: 0,
        w: 4,
        h: 6,
        __typename: 'FlexAlignment'
      },
      teaser: articleTeaser,
      __typename: 'FlexTeaser'
    },
    {
      alignment: {
        x: 7,
        y: 0,
        w: 5,
        h: 8,
        __typename: 'FlexAlignment'
      },
      teaser: pageTeaser,
      __typename: 'FlexTeaser'
    },

    {
      alignment: {
        x: 7,
        y: 8,
        w: 5,
        h: 8,
        __typename: 'FlexAlignment'
      },

      teaser: customTeaser,
      __typename: 'FlexTeaser'
    },
    {
      alignment: {
        x: 0,
        y: 4,
        w: 3,
        h: 4,
        __typename: 'FlexAlignment'
      },

      teaser: articleTeaser,
      __typename: 'FlexTeaser'
    },
    {
      alignment: {
        x: 3,
        y: 6,
        w: 4,
        h: 6,
        __typename: 'FlexAlignment'
      },
      teaser: pageTeaser,
      __typename: 'FlexTeaser'
    }
  ]
}
