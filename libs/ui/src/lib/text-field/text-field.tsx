import {TextField as MuiTextField} from '@mui/material'
import styled from '@emotion/styled'
import {ComponentProps} from 'react'

export type TextFieldProps = ComponentProps<typeof MuiTextField>

export function TextField({children, ...props}: TextFieldProps) {
  return <MuiTextField {...props} />
}
