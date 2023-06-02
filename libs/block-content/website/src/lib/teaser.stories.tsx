import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {CustomTeaser, Image} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser'
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

const customTeaser = {
  style: 'DEFAULT',
  image,
  preTitle: 'preTitle',
  title: 'Teambesprechung vom 23.05.',
  lead: 'Lead',
  contentUrl: 'https://example.com',
  properties: [],
  __typename: 'CustomTeaser'
} as CustomTeaser

export const WithClassName = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: customTeaser,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment'
    },
    teaser: customTeaser,
    css: css`
      background-color: #eee;
    `
  }
}
