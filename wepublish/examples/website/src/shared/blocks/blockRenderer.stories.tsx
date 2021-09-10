import React from 'react'
import {storiesOf} from '@storybook/react'
import {BlockType, EmbedType} from '../types'

import {BlockRenderer} from './blockRenderer'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockRichTextValue, mockGalleryMedia} from '../.storybook/storiesMockData'

storiesOf('Blocks|BlockRenderer', module)
  .addDecorator(centerLayoutDecorator(0.6))
  .add('Default', () => (
    <BlockRenderer
      blocks={[
        {key: '0', type: BlockType.RichText, value: mockRichTextValue},
        {key: '1', type: BlockType.Gallery, value: {media: mockGalleryMedia, title: 'Test'}},
        {
          key: '2',
          type: BlockType.Embed,
          value: {type: EmbedType.FacebookPost, userID: '20531316728', postID: '10154009990506729'}
        }
      ]}
    />
  ))
  .add('With Custom Wrapper', () => (
    <BlockRenderer
      blocks={[
        {key: '0', type: BlockType.RichText, value: mockRichTextValue},
        {key: '1', type: BlockType.Gallery, value: {media: mockGalleryMedia, title: 'Test'}},
        {
          key: '2',
          type: BlockType.Embed,
          value: {type: EmbedType.FacebookPost, userID: '20531316728', postID: '10154009990506729'}
        }
      ]}>
      {block => (
        <section style={{border: '1px dotted black', padding: '1rem', margin: '1rem'}}>
          {block}
        </section>
      )}
    </BlockRenderer>
  ))
