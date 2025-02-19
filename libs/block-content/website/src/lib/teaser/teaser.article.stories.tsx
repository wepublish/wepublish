import {Meta} from '@storybook/react'
import {ArticleTeaser, FullAuthorFragment, FullImageFragment} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Article'
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
  xl: 'https://unsplash.it/1200/400',
  l: 'https://unsplash.it/1000/400',
  m: 'https://unsplash.it/800/400',
  s: 'https://unsplash.it/500/300',
  xs: 'https://unsplash.it/300/200',
  xxs: 'https://unsplash.it/200/100',
  xlSquare: 'https://unsplash.it/1200/1200',
  lSquare: 'https://unsplash.it/1000/1000',
  mSquare: 'https://unsplash.it/800/800',
  sSquare: 'https://unsplash.it/500/500',
  xsSquare: 'https://unsplash.it/300/300',
  xxsSquare: 'https://unsplash.it/200/200'
} as FullImageFragment

const author = {
  __typename: 'Author',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'slug',
  name: 'Foobar',
  jobTitle: 'Editor',
  url: 'https://example.com',
  bio: [],
  links: [],
  image: undefined,
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
  tags: []
} as FullAuthorFragment

const articleTeaser = {
  __typename: 'ArticleTeaser',
  style: 'DEFAULT',
  image,
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  article: {
    id: 'clg2cxnig57497901rej8i9ubj1',
    slug: '',
    title: 'Title on the article',
    preTitle: 'Pre Title on the article',
    lead: 'Lead on the article',
    url: 'https://example.com',
    authors: [author, author],
    publishedAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-01').toISOString(),
    tags: [],
    breaking: false,
    comments: [],
    properties: [],
    socialMediaAuthors: [],

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

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: articleTeaser
  }
}

export const WithoutPreTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      preTitle: null
    }
  }
}

export const WithoutArticlePreTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      preTitle: null,
      article: {
        ...articleTeaser.article,
        preTitle: '',
        tags: [
          {
            __typename: 'Tag',
            id: '123',
            tag: 'Secondary Tag',
            main: false
          },
          {
            __typename: 'Tag',
            id: '1234',
            tag: 'Main Tag',
            main: true
          }
        ]
      }
    }
  }
}

export const WithoutTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      title: null
    }
  }
}

export const WithoutLead = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      lead: null
    }
  }
}

export const WithoutImage = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      image: null
    }
  }
}

export const WithoutImageWithoutBlock = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      image: null,
      article: {
        ...articleTeaser.article,
        blocks: []
      }
    }
  }
}

export const WithoutAuthors = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      article: {
        ...articleTeaser.article,
        authors: []
      }
    }
  }
}

export const WithoutDate = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...articleTeaser,
      article: {
        ...articleTeaser.article,
        publishedAt: null
      }
    }
  }
}
