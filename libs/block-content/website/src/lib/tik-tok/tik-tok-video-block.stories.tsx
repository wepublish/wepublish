import {Meta} from '@storybook/react'
import {TikTokVideoBlock} from './tik-tok-video-block'

export default {
  component: TikTokVideoBlock,
  title: 'Blocks/TikTok'
} as Meta

export const Default = {
  args: {
    userID: 'scout2015',
    videoID: '6718335390845095173'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
