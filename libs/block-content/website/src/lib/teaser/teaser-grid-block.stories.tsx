import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {
  ArticleTeaser,
  CustomTeaser,
  FullImageFragment,
  PageTeaser,
  TeaserGridBlock as TeaserGridBlockType
} from '@wepublish/website/api'
import {TeaserGridBlock} from './teaser-grid-block'

export default {
  component: TeaserGridBlock,
  title: 'Blocks/Teaser Grid'
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
  __typename: 'TeaserGridBlock',
  teasers: [articleTeaser, pageTeaser, customTeaser],
  numColumns: 3
} as TeaserGridBlockType

export const OneColumn = {
  args: {
    ...flexTeaser,
    numColumns: 1
  }
}

export const ThreeColumns = {
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
