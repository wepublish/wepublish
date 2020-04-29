import React from 'react'
import {storiesOf} from '@storybook/react'
import {EmbedType} from '../types'

import {EmbedBlock} from './embedBlock'
import {centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Blocks|EmbedBlock', module)
  .addDecorator(centerLayoutDecorator(0.6))
  .add('Facebook', () => (
    <EmbedBlock
      data={{type: EmbedType.FacebookPost, userID: '20531316728', postID: '10154009990506729'}}
    />
  ))
  .add('Instagram', () => (
    <EmbedBlock data={{type: EmbedType.InstagramPost, postID: 'B1ZFAoEgtoQ'}} />
  ))
  .add('Twitter', () => (
    <EmbedBlock
      data={{
        type: EmbedType.TwitterTweet,
        userID: 'TwitterSupport',
        tweetID: '1162114957762150400'
      }}
    />
  ))
  .add('YouTube', () => (
    <EmbedBlock
      data={{
        type: EmbedType.YouTubeVideo,
        videoID: 'M7lc1UVf-VE'
      }}
    />
  ))
  .add('Vimeo', () => (
    <EmbedBlock
      data={{
        type: EmbedType.VimeoVideo,
        videoID: '225683648'
      }}
    />
  ))
  .add('SoundCloud', () => (
    <EmbedBlock
      data={{
        type: EmbedType.SoundCloudTrack,
        trackID: '34019569'
      }}
    />
  ))
