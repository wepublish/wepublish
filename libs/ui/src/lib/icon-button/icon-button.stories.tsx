import {Meta} from '@storybook/react'
import {IconButton} from './icon-button'
import {MdAdd} from 'react-icons/md'

export default {
  component: IconButton,
  title: 'UI'
} as Meta

export const Default = {
  args: {
    children: <MdAdd />
  }
}
