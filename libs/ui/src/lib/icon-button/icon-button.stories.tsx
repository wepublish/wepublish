import {Meta} from '@storybook/react'
import {IconButton as IconButtonCmp} from './icon-button'
import {MdAdd} from 'react-icons/md'
import {Link, Stack} from '@mui/material'

export default {
  component: IconButtonCmp,
  title: 'UI/IconButton',
  render: () => (
    <Stack gap={1} alignItems={'start'}>
      <IconButtonCmp>
        <MdAdd />
      </IconButtonCmp>

      <br />
      <Link href="https://mui.com/material-ui/react-button/#icon-button" target="_blank">
        See more
      </Link>
    </Stack>
  )
} as Meta

export const IconButton = {}
