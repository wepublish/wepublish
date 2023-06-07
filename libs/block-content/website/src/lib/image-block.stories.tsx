import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {FullImageFragment} from '@wepublish/website/api'
import {ImageBlock} from './image-block'

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
  url: 'https://unsplash.it/500/500',
  bigURL: 'https://unsplash.it/800/800',
  largeURL: 'https://unsplash.it/500/500',
  mediumURL: 'https://unsplash.it/300/300',
  smallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

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
