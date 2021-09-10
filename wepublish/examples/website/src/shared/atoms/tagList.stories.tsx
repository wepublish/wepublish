import React from 'react'
import {storiesOf} from '@storybook/react'
import {TagList} from './tagList'
import {mockPeer, mockTags} from '../.storybook/storiesMockData'

storiesOf('Blocks|TagList', module)
  .add('With Peer', () => <TagList peer={mockPeer} tags={mockTags} />)
  .add('Only Tags', () => <TagList tags={mockTags} />)
