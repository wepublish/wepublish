import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {FullImageFragment} from '@wepublish/website/api'
import {ImageGalleryBlock} from './image-gallery-block'

export default {
  component: ImageGalleryBlock,
  title: 'Blocks/Image Gallery'
} as Meta

const image = (index: number) =>
  ({
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
    url: `https://unsplash.it/500/500?${index}`,
    xl: `https://unsplash.it/1200/400?${index}`,
    l: `https://unsplash.it/1000/400?${index}`,
    m: `https://unsplash.it/800/400?${index}`,
    s: `https://unsplash.it/500/300?${index}`,
    xs: `https://unsplash.it/300/200?${index}`,
    xxs: `https://unsplash.it/200/100?${index}`,
    xlSquare: `https://unsplash.it/1200/1200?${index}`,
    lSquare: `https://unsplash.it/1000/1000?${index}`,
    mSquare: `https://unsplash.it/800/800?${index}`,
    sSquare: `https://unsplash.it/500/500?${index}`,
    xsSquare: `https://unsplash.it/300/300?${index}`,
    xxsSquare: `https://unsplash.it/200/200?${index}`
  } as FullImageFragment)

export const Default = {
  args: {
    images: Array.from({length: 11}, (_, i) => ({
      image: image(i),
      caption:
        'Image caption that is extremely long so it is bigger than the countainer that would display it'
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
