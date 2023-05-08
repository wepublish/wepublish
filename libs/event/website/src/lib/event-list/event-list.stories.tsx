import {ComponentStory, Meta} from '@storybook/react'
import {EventList} from './event-list'
import {EventQuery, EventStatus} from '@wepublish/website/api'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {EventListItem} from './event-list-item'

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
    url: 'https://unsplash.it/500/281',
    largeURL: 'https://unsplash.it/500/281',
    mediumURL: 'https://unsplash.it/500/281',
    thumbURL: 'https://unsplash.it/500/281',
    squareURL: 'https://unsplash.it/500/281',
    previewURL: 'https://unsplash.it/500/281',
    column1URL: 'https://unsplash.it/500/281',
    column6URL: 'https://unsplash.it/500/281',
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
  __typename: 'Event'
} as EventQuery['event']

export default {
  component: EventList,
  title: 'Components/EventList'
} as Meta

const Template: ComponentStory<typeof EventList> = args => <EventList {...args} />
export const Default = Template.bind({})
Default.args = {
  data: {
    events: {
      nodes: [event, event, event, event, event],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: 1
    }
  },
  variables: {
    take: 10
  },
  onVariablesChange: action('onVariablesChange')
}

export const WithLoading = Template.bind({})
WithLoading.args = {
  data: undefined,
  loading: true,
  onVariablesChange: action('onVariablesChange')
}

export const WithError = Template.bind({})
WithError.args = {
  data: undefined,
  loading: false,
  error: new ApolloError({
    errorMessage: 'Foobar'
  }),
  onVariablesChange: action('onVariablesChange')
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  data: {
    events: {
      nodes: [event, event, event, event, event],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: 1
    }
  },
  className: 'extra-classname',
  onVariablesChange: action('onVariablesChange')
}

export const WithEmotion = Template.bind({})
WithEmotion.args = {
  data: {
    events: {
      nodes: [event, event, event, event, event],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: 1
    }
  },
  css: css`
    background-color: #eee;
  `,
  onVariablesChange: action('onVariablesChange')
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

export const WithoutImage = Template.bind({})
WithoutImage.args = {
  data: {
    events: {
      nodes: [
        {...event, image: null},
        event,
        {...event, image: null},
        event,
        {...event, image: null}
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false
      },
      totalCount: 1
    }
  },
  onVariablesChange: action('onVariablesChange')
}
