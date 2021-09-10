import React from 'react'
import {storiesOf} from '@storybook/react'
import {Loader} from './loader'
import {fontSizeDecorator, centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Atoms|Loader', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(70))
  .add('Default', () => <Loader text={'Loading'} />)
