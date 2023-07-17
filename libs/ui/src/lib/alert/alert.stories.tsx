import {Meta} from '@storybook/react'
import {Alert, AlertProps} from './alert'

export default {
  component: Alert,
  title: 'UI/Alert'
} as Meta<typeof Alert>

const Template = (args: AlertProps) => <Alert {...args}>Alert</Alert>

export const Default = {
  render: Template
}
