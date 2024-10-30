import {styled} from '@mui/material'
import {ApiV1, BreakBlock, hasBlockStyle, isBreakBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isLightBreak = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Light'), isBreakBlock])(block)

export const BajourLightBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.secondary.main};
  color: ${({theme}) => theme.palette.secondary.contrastText};
`

export const isSponsoredBreak = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Sponsored'), isBreakBlock])(block)

export const BajourSponsoredBreakBlock = styled(BreakBlock)`
  background-color: #a9eea7;
  color: ${({theme}) => theme.palette.getContrastText('#A9EEA7')};
`
