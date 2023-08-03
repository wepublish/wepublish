import {Meta} from '@storybook/react'
import {InstagramPostBlock} from './instagram-post-block'

export default {
  component: InstagramPostBlock,
  title: 'Blocks/Instagram'
} as Meta

export const Default = {
  args: {
    postID: 'CvACOxxIqT2'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
