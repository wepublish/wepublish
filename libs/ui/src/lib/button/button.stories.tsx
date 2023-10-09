import {Meta} from '@storybook/react'
import {Button as ButtonCmp} from './button'
import {MdAdd, MdDelete} from 'react-icons/md'
import {Link, Stack} from '@mui/material'

export default {
  component: ButtonCmp,
  title: 'UI/Button',
  render: () => (
    <Stack gap={1} alignItems={'start'}>
      <ButtonCmp>Click Me</ButtonCmp>
      <ButtonCmp startIcon={<MdAdd />}>Click Me</ButtonCmp>
      <ButtonCmp endIcon={<MdDelete />}>Click Me</ButtonCmp>

      <br />
      <Link href="https://mui.com/material-ui/react-button/" target="_blank">
        See more
      </Link>
    </Stack>
  )
} as Meta<typeof ButtonCmp>

export const Button = {}
