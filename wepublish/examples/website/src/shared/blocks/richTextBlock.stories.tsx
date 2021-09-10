import React from 'react'
import {storiesOf} from '@storybook/react'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockRichTextValue} from '../.storybook/storiesMockData'

storiesOf('Blocks|RichTextBlock', module)
  .addDecorator(centerLayoutDecorator())
  .add('Default', () => <RichTextBlock value={mockRichTextValue} />)
