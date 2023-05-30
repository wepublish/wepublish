import {Button as MuiButton} from '@mui/material'
import {ComponentProps, PropsWithChildren} from 'react'

export type ButtonProps = PropsWithChildren<ComponentProps<typeof MuiButton>>

export function Button({children, variant = 'contained', ...props}: ButtonProps) {
  return (
    <MuiButton {...props} variant={variant}>
      {children}
    </MuiButton>
  )
}
