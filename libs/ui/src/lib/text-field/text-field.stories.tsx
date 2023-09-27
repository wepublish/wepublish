import {Meta} from '@storybook/react'
import {TextField, TextFieldProps} from './text-field'

export default {
  component: TextField,
  title: 'UI/TextField'
} as Meta<typeof TextField>

const Template = (args: TextFieldProps) => <TextField {...args} />

export const Default = {
  render: Template,
  args: {
    label: 'Label'
  } as TextFieldProps
}
