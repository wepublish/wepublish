import {Meta} from '@storybook/react'
import {Event} from './event'
import {EventQuery, EventStatus} from '@wepublish/website/api'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'

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
    xxsSquare: 'https://unsplash.it/200/200',
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
  url: 'https://example.com',
  __typename: 'Event'
} as EventQuery['event']

export default {
  component: Event,
  title: 'Components/Event'
} as Meta

export const Default = {
  args: {
    data: {
      event
    }
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  args: {
    data: {
      event
    },
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {
      event
    },
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    data: {
      event: {...event, image: null}
    }
  }
}
