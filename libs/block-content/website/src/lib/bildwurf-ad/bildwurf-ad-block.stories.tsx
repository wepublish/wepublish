import {Meta} from '@storybook/react'
import {BildwurfAdBlock} from './bildwurf-ad-block'
import {mockBildwurfBlock} from '@wepublish/storybook/mocks'

export default {
  component: BildwurfAdBlock,
  title: 'Blocks/Bildwurf Ad'
} as Meta

export const Default = {
  args: mockBildwurfBlock()
}
