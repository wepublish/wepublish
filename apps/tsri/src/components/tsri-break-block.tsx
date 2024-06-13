import {styled} from '@mui/material'
import {BreakBlock, HeadingWithoutImage} from '@wepublish/website'

export const TsriBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.accent.main};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(10)};
  }

  ${HeadingWithoutImage} {
    font-size: ${({theme}) => theme.typography.h3.fontSize};
  }
`
