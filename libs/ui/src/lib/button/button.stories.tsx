import {Meta} from '@storybook/react'
import {Button} from './button'
import {MdAdd, MdDelete} from 'react-icons/md'

export default {
  component: Button,
  title: 'UI/Button'
} as Meta<typeof Button>

export const Default = {
  args: {
    children: 'Click me'
  }
}

export const WithIcon = {
  args: {
    children: 'Click me',
    startIcon: <MdAdd />,
    endIcon: <MdDelete />
  }
}
