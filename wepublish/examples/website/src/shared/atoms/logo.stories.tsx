import React from 'react'
import {storiesOf} from '@storybook/react'
import {Logo, SmallLogo} from './logo'
import {fontSizeDecorator, centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Atoms|Logo', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(70))
  .add('Default', () => <Logo />)

storiesOf('Atoms|SmallLogo', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(70))
  .add('Default', () => <SmallLogo />)
