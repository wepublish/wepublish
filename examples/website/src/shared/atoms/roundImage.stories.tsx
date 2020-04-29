import React from 'react'
import {storiesOf} from '@storybook/react'
import {RoundImage} from './roundImage'
import {centerLayoutDecorator, fontSizeDecorator} from '../.storybook/decorators'

storiesOf('Atoms|RoundImage', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(120))
  .add('Default', () => (
    <RoundImage src="https://dummyimage.com/300x200/111333/0011ff" width={300} height={200} />
  ))
