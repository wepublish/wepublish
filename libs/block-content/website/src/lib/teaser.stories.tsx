import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {image} from '@wepublish/testing/fixtures/graphql'
import {CustomTeaser} from '@wepublish/website/api'
import {Teaser} from './teaser'

export default {
  component: Teaser,
  title: 'Blocks/Teaser'
} as Meta

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
