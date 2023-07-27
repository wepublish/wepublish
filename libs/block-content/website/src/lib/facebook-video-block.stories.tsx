import {Meta} from '@storybook/react'
import {FacebookVideoBlock} from './facebook-video-block'

export default {
  component: FacebookVideoBlock,
  title: 'Blocks/Facebook/Video'
} as Meta

export const Default = {
  args: {
    userID: 'ladolcekita',
    videoID: '1190669514972266'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
