import {Button as MuiButton} from '@mui/material'
import {ComponentProps, PropsWithChildren} from 'react'

type MuiButtonProps = ComponentProps<typeof MuiButton>

type ButtonProps = PropsWithChildren<
  MuiButtonProps &
    (MuiButtonProps['LinkComponent'] extends React.ElementType
      ? {target?: string}
      : Record<string, never>)
>

export function Button({children, variant = 'contained', ...props}: ButtonProps) {
  return (
    <MuiButton {...props} variant={variant}>
      {children}
    </MuiButton>
  )
}
