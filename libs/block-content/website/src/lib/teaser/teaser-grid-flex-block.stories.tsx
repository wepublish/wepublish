import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {
  ArticleTeaser,
  CustomTeaser,
  FullImageFragment,
  PageTeaser,
  TeaserGridFlexBlock as TeaserGridFlexBlockType
} from '@wepublish/website/api'
import {TeaserGridFlexBlock} from './teaser-grid-flex-block'

export default {
  component: TeaserGridFlexBlock,
  title: 'Blocks/Teaser Grid Flex'
} as Meta

const image = {
  id: '1234',
  createdAt: new Date().toDateString(),
  modifiedAt: new Date().toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  description: 'An image description',
  title: 'An image title',
  filename: 'An image filename',
  url: 'https://unsplash.it/500/500',
  bigURL: 'https://unsplash.it/800/800',
  largeURL: 'https://unsplash.it/500/500',
  mediumURL: 'https://unsplash.it/300/300',
  smallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

const customTeaser = {
  style: 'DEFAULT',
  image,
  preTitle: null,
  title: 'Teambesprechung vom 23.05.',
  lead: 'Lead',
  contentUrl: 'https://example.com',
  properties: [],
  __typename: 'CustomTeaser'
} as CustomTeaser

const articleTeaser = {
  __typename: 'ArticleTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  article: {
    id: 'clg2cxnig57497901rej8i9ubj1',
    title: 'Title on the article',
    preTitle: 'Pre Title on the article',
    lead: 'Lead on the article',
    url: 'https://example.com',
    blocks: [
      {
        __typename: 'TitleBlock',
        title: 'Title from block',
        lead: 'Lead from block'
      },
      {
        __typename: 'ImageBlock',
        caption: null,
        image
      }
    ]
  }
} as ArticleTeaser

const pageTeaser = {
  __typename: 'PageTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  page: {
    id: 'cl95fumlq261901phgrctx4mz',
    title: 'Title on the page',
    description: 'Description on the page',
    url: 'https://example.com',
    blocks: [
      {
        __typename: 'TitleBlock',
        title: 'Title from block',
        lead: 'Lead from block'
      },
      {
        __typename: 'ImageBlock',
        caption: null,
        image
      }
    ]
  }
} as PageTeaser

const flexTeaser = {
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
} as TeaserGridFlexBlockType

export const Default = {
  args: {
    ...flexTeaser
  }
}

export const WithShowLoad = {
  args: {
    ...flexTeaser,
    showLead: true
  }
}

export const WithClassName = {
  args: {
    ...flexTeaser,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...flexTeaser,
    css: css`
      background-color: #eee;
    `
  }
}
