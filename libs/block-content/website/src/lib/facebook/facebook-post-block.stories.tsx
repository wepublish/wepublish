import {Meta} from '@storybook/react'
import {FacebookPostBlock} from './facebook-post-block'

export default {
  component: FacebookPostBlock,
  title: 'Blocks/Facebook/Post'
} as Meta

export const Default = {
  args: {
    userID: 'ladolcekita',
    postID: 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
