import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {
  ArticleTeaser,
  EventStatus,
  EventTeaser,
  FullImageFragment,
  PageTeaser
} from '@wepublish/website/api'
import {TeaserListBlock} from './teaser-list-block'

export default {
  component: TeaserListBlock,
  title: 'Blocks/Teaser List'
} as Meta

const image = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
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

const eventTeaser = {
  __typename: 'EventTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  event: {
    __typename: 'Event',
    id: 'cl95fumlq261901phgrctx4mz',
    name: 'Name of Event',
    image,
    url: 'https://example.com',
    startsAt: new Date('2023-01-01').toISOString(),
    status: EventStatus.Scheduled,
    description: [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
          }
        ]
      }
    ]
  }
} as EventTeaser

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
    ],
    authors: [],
    publishedAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-01').toISOString(),
    breaking: false,
    comments: [],
    properties: [],
    slug: '',
    socialMediaAuthors: [],
    tags: []
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

export const Article = {
  args: {
    teasers: [articleTeaser, articleTeaser, articleTeaser]
  }
}

export const Page = {
  ...Article,
  args: {
    teasers: [pageTeaser, pageTeaser, pageTeaser]
  }
}

export const Event = {
  ...Article,
  args: {
    teasers: [eventTeaser, eventTeaser, eventTeaser]
  }
}

export const WithTitle = {
  ...Article,
  args: {
    ...Article.args,
    title: 'Foobar Title'
  }
}

export const WithClassName = {
  ...Article,
  args: {
    ...Article.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Article,

  args: {
    ...Article.args,
    css: css`
      background-color: #eee;
    `
  }
}
