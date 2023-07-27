import {Meta} from '@storybook/react'
import {TwitterTweetBlock} from './twitter-tweet-block'

export default {
  component: TwitterTweetBlock,
  title: 'Blocks/Twitter'
} as Meta

export const Default = {
  args: {
    userID: 'MrBeast',
    tweetID: '1683176302503772161'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
