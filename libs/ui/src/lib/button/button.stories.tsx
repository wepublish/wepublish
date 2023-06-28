import {Meta} from '@storybook/react'
import {Button, ButtonProps} from './button'

export default {
  component: Button,
  title: 'UI/Button'
} as Meta<typeof Button>

const Template = (args: ButtonProps) => <Button {...args}>Click me</Button>
export const Default = {
  render: Template
}
