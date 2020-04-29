import React from 'react'

import {storiesOf} from '@storybook/react'
import {QuoteBlock} from './quoteBlock'
import {centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Blocks|QuoteBlock', module)
  .addDecorator(centerLayoutDecorator())
  .add('Default', () => (
    <QuoteBlock
      text={
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'
      }
    />
  ))
  .add('With Name', () => (
    <QuoteBlock
      author={'Max Muster'}
      text={
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.'
      }
    />
  ))
