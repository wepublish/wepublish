import {Meta} from '@storybook/react'
import {FacebookVideoBlock} from './facebook-video-block'

export default {
  component: FacebookVideoBlock,
  title: 'Blocks/Facebook/Video'
} as Meta

export const Default = {
  args: {
    userID: '100064959061177',
    videoID: '1310370486335266'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
