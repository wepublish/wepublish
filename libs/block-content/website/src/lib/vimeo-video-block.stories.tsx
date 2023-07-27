import {Meta} from '@storybook/react'
import {VimeoVideoBlock} from './vimeo-video-block'

export default {
  component: VimeoVideoBlock,
  title: 'Blocks/YouTube'
} as Meta

export const Default = {
  args: {
    videoID: '104626862'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
