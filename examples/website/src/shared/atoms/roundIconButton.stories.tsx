import React from 'react'
import {storiesOf} from '@storybook/react'

import {fontSizeDecorator, centerLayoutDecorator} from '../.storybook/decorators'
import {RoundIconButton} from './roundIconButton'
import {IconType} from './icon'

storiesOf('Atoms|RoundIconButton', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(70))
  .add('Default', () => <RoundIconButton icon={IconType.Facebook} />)
