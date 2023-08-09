import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {FullImageFragment, PeerQuery} from '@wepublish/website/api'
import {Node} from 'slate'
import {PeerInformation} from './peer-information'

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
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
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

const text: Node[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Jetzt We.Publish-Member werden!'
      }
    ]
  }
]

const peer = {
  id: 'clftnfuzh204501muj13hwvcu',
  name: 'test demo',
  slug: 'test-demo',
  isDisabled: false,
  hostURL: 'https://api.demo.wepublish.media/v1/admin',
  profile: {
    name: 'We.Publish',
    hostURL: 'https://api.demo.wepublish.media',
    themeColor: '#000000',
    themeFontColor: '#ffffff',
    logo: image,
    callToActionText: text,
    callToActionURL: 'https://demo.wepublish.media/',
    callToActionImage: image,
    callToActionImageURL: 'https://demo.wepublish.media/',
    websiteURL: 'https://demo.wepublish.media/',
    __typename: 'PeerProfile'
  },
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  __typename: 'Peer'
} as PeerQuery['peer']

export default {
  component: PeerInformation,
  title: 'Components/Peer Information'
} as Meta

export const Default = {
  args: {
    originUrl: 'https://example.com',
    data: {
      peer
    }
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      peer: null
    },
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
