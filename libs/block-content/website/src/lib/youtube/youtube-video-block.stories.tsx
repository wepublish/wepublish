import {Meta} from '@storybook/react'
import {YouTubeVideoBlock} from './youtube-video-block'

export default {
  component: YouTubeVideoBlock,
  title: 'Blocks/YouTube'
} as Meta

export const Default = {
  args: {
    videoID: 'CCOdQsZa15o'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
