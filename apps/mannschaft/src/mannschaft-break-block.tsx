import {styled} from '@mui/material'
import {
  ApiV1,
  BreakBlock,
  hasBlockStyle,
  HeadingWithoutImage,
  isBreakBlock
} from '@wepublish/website'
import {allPass} from 'ramda'

// Main
export const isPrimaryBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Primary Bg'), isBreakBlock])(block)

export const isSecondaryBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Secondary Bg'), isBreakBlock])(block)

export const isAccentBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Accent Bg'), isBreakBlock])(block)

export const isLightAccentBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Light Accent Bg'), isBreakBlock])(block)

// Sub
export const isVioletBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Violett Bg'), isBreakBlock])(block)

export const isPurpleBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Lila Bg'), isBreakBlock])(block)

export const isWarningBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Warning Bg'), isBreakBlock])(block)

export const isErrorBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Error Bg'), isBreakBlock])(block)

export const isSuccessBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Success Bg'), isBreakBlock])(block)

export const isInfoBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Info Bg'), isBreakBlock])(block)

export const MannschaftBreakBlock = styled(BreakBlock)`
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr max-content;
    gap: ${({theme}) => theme.spacing(4)};
  }

  ${HeadingWithoutImage} {
    font-size: ${({theme}) => theme.typography.h3};
  }
`
