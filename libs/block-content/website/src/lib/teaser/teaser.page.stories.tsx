import {Meta} from '@storybook/react'
import {FullImageFragment, PageTeaser, TeaserStyle} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Page'
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

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: pageTeaser
  }
}

export const WithLightStyle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...pageTeaser,
      style: TeaserStyle.Light
    }
  }
}

export const WithoutBlockWithLightStyle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...pageTeaser,
      style: TeaserStyle.Light,
      lead: null,
      page: {
        ...pageTeaser.page,
        blocks: []
      }
    }
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
      ...pageTeaser,
      preTitle: null
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
      ...pageTeaser,
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
      ...pageTeaser,
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
      ...pageTeaser,
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
      ...pageTeaser,
      image: null,
      Page: {
        ...pageTeaser.page,
        blocks: []
      }
    }
  }
}
