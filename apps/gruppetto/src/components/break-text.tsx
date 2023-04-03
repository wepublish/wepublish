import {css, styled} from '@mui/material'
import {PropsWithChildren, ComponentProps} from 'react'

const BreakTextWrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(3)};
  align-items: center;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      text-align: center;
    }
  `}
`

export const BreakText = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof BreakTextWrapper>>) => (
  <BreakTextWrapper {...props}>{children}</BreakTextWrapper>
)
