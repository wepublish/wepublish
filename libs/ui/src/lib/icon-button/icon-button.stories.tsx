import {Meta} from '@storybook/react'
import {IconButton} from './icon-button'

export default {
  component: IconButton,
  title: 'Icon Button'
} as Meta

export const Default = {
  args: {
    children: 'Click me'
  }
}
