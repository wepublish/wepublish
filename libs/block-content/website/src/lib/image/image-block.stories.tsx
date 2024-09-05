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
  xxsSquare: 'https://unsplash.it/200/200',
  source: 'Reddit.com'
} as FullImageFragment

export const Default = {
  args: {
    image,
    caption: 'Image caption'
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

export const WithoutCaption = {
  ...Default,
  args: {
    ...Default.args,
    caption: ''
  }
}

export const WithoutSource = {
  ...Default,
  args: {
    ...Default.args,
    image: {
      ...image,
      source: ''
    }
  }
}

export const WithLink = {
  ...Default,
  args: {
    ...Default.args,
    linkUrl: 'https://example.com'
  }
}
