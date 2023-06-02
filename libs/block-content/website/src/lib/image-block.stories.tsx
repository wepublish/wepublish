import {Meta} from '@storybook/react'
import {ImageBlock} from './image-block'
import {css} from '@emotion/react'
import {Image} from '@wepublish/website/api'

export default {
  component: ImageBlock,
  title: 'Blocks/Image'
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
  url: 'https://unsplash.it/500/500'
} as Image

export const Default = {
  args: {
    image,
    caption: 'Image caption'
  }
}

export const WithClassName = {
  args: {
    image,
    caption: 'Image caption',
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    image,
    caption: 'Image caption',
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutCaption = {
  args: {
    image,
    caption: ''
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
