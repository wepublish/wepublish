import {Button as MuiButton, styled} from '@mui/material'
import {BuilderButtonProps} from '@wepublish/website-builder'

const ButtonWrapper = styled(MuiButton)`
  font-weight: 700;
  padding: ${({theme}) => theme.spacing(1.7)} ${({theme}) => theme.spacing(3)};
  font-size: ${({theme}) => theme.typography.body1.fontSize};
  box-shadow: none;
`

export function Button({children, variant = 'contained', ...props}: BuilderButtonProps) {
  return (
    <ButtonWrapper {...props} variant={variant}>
      {children}
    </ButtonWrapper>
  )
}
