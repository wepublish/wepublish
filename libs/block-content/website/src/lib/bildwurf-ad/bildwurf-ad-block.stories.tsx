import {Meta} from '@storybook/react'
import {BildwurfAdBlock} from './bildwurf-ad-block'

export default {
  component: BildwurfAdBlock,
  title: 'Blocks/Bildwurf Ad'
} as Meta

export const Default = {
  args: {
    zoneID: '77348'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
