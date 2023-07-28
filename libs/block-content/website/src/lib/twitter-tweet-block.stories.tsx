import {Meta} from '@storybook/react'
import {TwitterTweetBlock} from './twitter-tweet-block'

export default {
  component: TwitterTweetBlock,
  title: 'Blocks/Twitter'
} as Meta

export const Default = {
  args: {
    userID: 'WePublish_media',
    tweetID: '1600079498845863937'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
