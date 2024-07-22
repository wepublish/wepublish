import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {ImageSlider} from './image-slider'
import {FullImageFragment} from '@wepublish/website/api'

export default {
  component: ImageSlider,
  title: 'Blocks/Image Gallery/Block Styles/Slider'
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

export const Default = {
  args: {
    images: [
      {image, caption: 'ABC'},
      {image},
      {
        image,
        caption:
          'Ultra Long Caption just to make sure this is rendering correctly. Because we never know what some people might write.'
      }
    ]
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
