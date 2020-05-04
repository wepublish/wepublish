import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {PageHeader} from './pageHeader'

storiesOf('Atoms|PageHeader*', module)
  .addDecorator(centerLayoutDecorator(0.6))
  .add('Default', () => <PageHeader title={'Basel'} />)
