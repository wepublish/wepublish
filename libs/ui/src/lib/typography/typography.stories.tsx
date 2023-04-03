import {ComponentMeta} from '@storybook/react'
import {Button, ButtonProps} from './typography'

export default {
  component: Button,
  title: 'Button'
} as ComponentMeta<typeof Button>

const Template = (args: ButtonProps) => <Button {...args}>Click me</Button>
export const Default = Template.bind({})
