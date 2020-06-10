import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockPeer} from '../.storybook/storiesMockData'
import {CalloutBreakBlock} from './calloutBreakBlock'

storiesOf('Blocks|CalloutBreak*', module)
  .addDecorator(centerLayoutDecorator(0.8))
  .add('Default', () => (
    <CalloutBreakBlock
      text={'Unterstuetze uns!'}
      linkText={'Mehr'}
      linkURL={'https://wepublish.ch/'}
      linkExternal={false}
      bgStyle={'green'}
      bgColor={'white'}
      bgImage={'null'}
    />
  ))
  .add('Peer', () => (
    <CalloutBreakBlock
      peer={mockPeer}
      text={'Unterstuetze uns!'}
      linkText={'Mehr'}
      linkURL={'https://wepublish.ch/'}
      linkExternal={false}
      bgStyle={'green'}
      bgColor={'white'}
      bgImage={'null'}
    />
  ))
