import {Meta} from '@storybook/react'
import {FullImageFragment} from '@wepublish/website/api'
import {Image} from './image'

export default {
  component: Image,
  title: 'Components/Image'
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

export const Default = {
  args: {
    image
  }
}

export const WithoutDescription = {
  args: {
    image: {...image, description: undefined},
    caption: 'Image caption'
  }
}

export const WithoutTitle = {
  args: {
    image: {...image, title: undefined},
    caption: 'Image caption'
  }
}
