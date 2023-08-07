import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {image} from '@wepublish/testing/fixtures/graphql'
import {ImageBlock} from './image-block'

export default {
  component: ImageBlock,
  title: 'Blocks/Image'
} as Meta

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
