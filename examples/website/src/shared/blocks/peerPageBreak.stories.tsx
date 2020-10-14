import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockPeer} from '../.storybook/storiesMockData'
import {PageBreakBlock} from './peerPageBreak'

storiesOf('Blocks|PeerPageBreak*', module)
  .addDecorator(centerLayoutDecorator(0.8))
  .add('Default', () => (
    <PageBreakBlock
      text={'Unterstuetze uns!'}
      htmlText={'Dein Commitment zählt.'}
      linkText={'Mehr'}
      linkURL={'https://wepublish.ch/'}
      linkTarget={'internal'}
      styleOption={'default'}
      layoutOption={'default'}
      image={null}
    />
  ))
  .add('Peer', () => (
    <PageBreakBlock
      peer={mockPeer}
      text={'Unterstuetze uns!'}
      linkText={'Mehr'}
      linkURL={'https://wepublish.ch/'}
      linkTarget={'internal'}
      styleOption={'default'}
      layoutOption={'default'}
      image={null}
    />
  ))
