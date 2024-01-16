import {Meta} from '@storybook/react'
import {EventStatus, EventTeaser, FullImageFragment, TeaserStyle} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser/Event'
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

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: eventTeaser
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
      ...eventTeaser,
      style: TeaserStyle.Light
    }
  }
}

export const WithoutDescription = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...eventTeaser,
      lead: null
    }
  }
}

export const WithoutDescriptionWithLightStyle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...eventTeaser,
      style: TeaserStyle.Light,
      lead: null,
      event: {
        ...eventTeaser.event,
        description: []
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
      ...eventTeaser,
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
      ...eventTeaser,
      title: null
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
      ...eventTeaser,
      image: null
    }
  }
}

export const WithoutImageWithoutEventImage = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: {
      ...eventTeaser,
      image: null,
      event: {
        ...eventTeaser.event,
        image: null
      }
    }
  }
}
