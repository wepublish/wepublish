import {css, styled} from '@mui/material'
import {BreakBlock} from '@wepublish/website'

export const TsriBreakBlock = styled(BreakBlock)`
  background-color: #f5ff64;
  padding: ${({theme}) => theme.spacing(4)};
  margin-top: ${({theme}) => theme.spacing(4)};
  margin-bottom: ${({theme}) => theme.spacing(4)};

  ${({theme}) =>
    css`
      ${theme.breakpoints.up('md')} {
        padding: ${theme.spacing(9)};
        margin-top: ${theme.spacing(10)};
        margin-bottom: ${theme.spacing(10)};
        gap: ${theme.spacing(10)};
        grid-template-columns: 1fr 1fr;
      }
    `}
`
