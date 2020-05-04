import React from 'react'
import {storiesOf} from '@storybook/react'
import {PrimaryButton} from './primaryButton'
import {fontSizeDecorator, centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Atoms|PrimaryButton', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(12))
  .add('Default', () => <PrimaryButton text="I'm a button" />)
