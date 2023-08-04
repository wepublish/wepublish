import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {image} from '@wepublish/testing/fixtures/graphql'
import {ImageGalleryBlock} from './image-gallery-block'

export default {
  component: ImageGalleryBlock,
  title: 'Blocks/Image Gallery'
} as Meta

export const Default = {
  args: {
    images: Array.from({length: 11}, (_, i) => ({
      image,
      caption: 'Image caption'
    }))
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
    images: Default.args.images.map((image, index) => {
      if (!(index % 3) && !(index % 2)) {
        return {...image, caption: ''}
      }

      return image
    })
  }
}
