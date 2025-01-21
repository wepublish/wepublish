import {Alert as MuiAlert} from '@mui/material'
import styled from '@emotion/styled'
import {ComponentProps, PropsWithChildren} from 'react'

export type AlertProps = PropsWithChildren<ComponentProps<typeof MuiAlert>>

export function Alert({children, ...props}: AlertProps) {
  return <MuiAlert {...props}>{children}</MuiAlert>
}
