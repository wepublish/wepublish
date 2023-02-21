import {Button as MuiButton} from '@mui/material'
import {ComponentProps, PropsWithChildren} from 'react'

export type ButtonProps = PropsWithChildren<ComponentProps<typeof MuiButton>>

export function Button({children, ...props}: ButtonProps) {
  return (
    <MuiButton {...props} variant="contained">
      {children}
    </MuiButton>
  )
}
