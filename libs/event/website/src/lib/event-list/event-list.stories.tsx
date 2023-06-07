import {Meta} from '@storybook/react'
import {EventList} from './event-list'
import {EventQuery, EventStatus} from '@wepublish/website/api'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'

const event = {
  id: '16ca80ce-a2d0-44dc-8c87-b735e4b08877',
  name: 'Cool concert',
  description: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    }
  ],
  status: EventStatus.Scheduled,
  location: 'Basel',
  image: {
    __typename: 'Image',
    id: 'ljh9FHAvHAs0AxC',
    createdAt: '2023-04-18T12:38:56.369Z',
    modifiedAt: '2023-04-18T12:38:56.371Z',
    filename: 'DSC07717',
    extension: '.JPG',
    width: 4000,
    height: 6000,
    fileSize: 8667448,
    description: null,
    tags: [],
    source: null,
    link: null,
    license: null,
    focalPoint: {
      x: 0.5,
      y: 0.5
    },
    title: null,
    url: 'https://unsplash.it/500/500',
    bigURL: 'https://unsplash.it/800/400',
    largeURL: 'https://unsplash.it/500/300',
    mediumURL: 'https://unsplash.it/300/200',
    smallURL: 'https://unsplash.it/200/100',
    squareBigURL: 'https://unsplash.it/800/800',
    squareLargeURL: 'https://unsplash.it/500/500',
    squareMediumURL: 'https://unsplash.it/300/300',
    squareSmallURL: 'https://unsplash.it/200/200',
    format: 'jpg',
    mimeType: 'image/jpg'
  },
  tags: [
    {
      id: 'cldwtndha026601nui49kyxrk',
      tag: 'Concert',
      __typename: 'Tag'
    }
  ],
  startsAt: '2023-02-24T09:00:00.000Z',
  endsAt: '2023-02-25T07:30:00.000Z',
  __typename: 'Event',
  url: 'https://example.com'
} as EventQuery['event']

export default {
  component: EventList,
  title: 'Components/EventList'
} as Meta

export const Default = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    variables: {
      take: 10
    },
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    }),
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithClassName = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    className: 'extra-classname',
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithEmotion = {
  args: {
    data: {
      events: {
        nodes: [
          event,
          {...event, id: '2'},
          {...event, id: '3'},
          {...event, id: '4'},
          {...event, id: '5'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    css: css`
      background-color: #eee;
    `,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithoutImage = {
  args: {
    data: {
      events: {
        nodes: [
          {...event, image: null},
          {...event, id: '2'},
          {...event, id: '3', image: null},
          {...event, id: '4'},
          {...event, id: '5', image: null}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    onVariablesChange: action('onVariablesChange')
  }
}
