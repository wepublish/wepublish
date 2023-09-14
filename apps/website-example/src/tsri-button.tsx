import {Theme, css, useTheme} from '@mui/material'
import {Button} from '@wepublish/ui'
import {BuilderButtonProps} from '@wepublish/website'
import {forwardRef, useMemo} from 'react'

const tsriButtonStyles = (theme: Theme) => css`
  border-radius: initial;
  box-shadow: initial;
  text-transform: none;
  font-size: 1.125rem;
  padding: ${theme.spacing(1.25)} ${theme.spacing(2)};
  font-weight: ${theme.typography.fontWeightMedium};

  &:hover {
    box-shadow: initial;
  }
`

export const TsriButton = forwardRef<HTMLButtonElement, BuilderButtonProps>(function TsriButton(
  {children, ...props},
  ref
) {
  const theme = useTheme()
  const styles = useMemo(() => tsriButtonStyles(theme), [theme])

  return (
    <Button {...props} ref={ref} css={styles}>
      {children}
    </Button>
  )
})
