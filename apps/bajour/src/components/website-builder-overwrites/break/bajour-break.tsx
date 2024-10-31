import {styled} from '@mui/material'
import {ApiV1, BreakBlock, hasBlockStyle, isBreakBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const BajourBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.accent.main};
  color: ${({theme}) => theme.palette.accent.contrastText};

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding-left: 0;
    padding-right: 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: ${({theme}) => theme.spacing(10)};
    padding-right: ${({theme}) => theme.spacing(10)};
  }
`

export const isLightBreak = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Light'), isBreakBlock])(block)

export const BajourLightBreakBlock = styled(BajourBreakBlock)`
  background-color: ${({theme}) => theme.palette.secondary.main};
  color: ${({theme}) => theme.palette.secondary.contrastText};
`

export const isSponsoredBreak = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Sponsored'), isBreakBlock])(block)

export const BajourSponsoredBreakBlock = styled(BajourBreakBlock)`
  background-color: #a9eea7;
  color: ${({theme}) => theme.palette.getContrastText('#A9EEA7')};
`
