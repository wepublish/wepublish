import {Button as MuiButton} from '@mui/material'
import styled from '@emotion/styled'
import {ComponentProps, PropsWithChildren} from 'react'

type MuiButtonProps = ComponentProps<typeof MuiButton>

export type ButtonProps = PropsWithChildren<MuiButtonProps> &
  (MuiButtonProps extends {LinkComponent?: React.ElementType} ? {target?: string} : object)

export function Button({children, variant = 'contained', ...props}: ButtonProps) {
  return (
    <MuiButton {...props} variant={variant}>
      {children}
    </MuiButton>
  )
}
