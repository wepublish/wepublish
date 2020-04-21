import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {ListicalBLock} from './listicalBlock'
import {mockListical} from '../.storybook/storiesMockData'

storiesOf('Blocks|ListicalBlock', module)
  .addDecorator(centerLayoutDecorator())
  .add('Default', () => <ListicalBLock listical={mockListical} />)
