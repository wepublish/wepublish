import {Meta} from '@storybook/react'
import {image} from '@wepublish/testing/fixtures/graphql'
import {Image} from './image'

export default {
  component: Image,
  title: 'Components/Image'
} as Meta

export const Default = {
  args: {
    image
  }
}

export const Square = {
  args: {
    image,
    square: true
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
