import {IconButton as MuiIconButton} from '@mui/material'
import styled from '@emotion/styled'
import {ComponentProps, PropsWithChildren} from 'react'

export type IconButtonProps = PropsWithChildren<ComponentProps<typeof MuiIconButton>>

export function IconButton({children, ...props}: IconButtonProps) {
  return <MuiIconButton {...props}>{children}</MuiIconButton>
}
