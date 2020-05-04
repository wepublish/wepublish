import React from 'react'
import {storiesOf} from '@storybook/react'
import {ImageBlock} from './imageBlock'
import {centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Blocks|ImageBlock', module)
  .addDecorator(centerLayoutDecorator(0.6))
  .add('Default', () => <ImageBlock src="https://dummyimage.com/300x200/fa00fa/0011ff" />)
