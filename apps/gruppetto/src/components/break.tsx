import {css, styled} from '@mui/material'
import {PropsWithChildren, ComponentProps} from 'react'

const BreakImageWrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(3)};
  align-items: center;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: 1fr 1fr;
      gap: ${theme.spacing(30)};
    }
  `}
`

export const BreakImage = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof BreakImageWrapper>>) => (
  <BreakImageWrapper {...props}>{children}</BreakImageWrapper>
)
