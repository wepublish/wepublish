import {Meta} from '@storybook/react'
import {Button} from './button'

export default {
  component: Button,
  title: 'UI/Button'
} as Meta<typeof Button>

export const Default = {
  args: {
    children: 'Click me'
  }
}
