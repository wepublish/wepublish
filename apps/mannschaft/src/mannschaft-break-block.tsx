import styled from '@emotion/styled'
import {
  ApiV1,
  BreakBlock,
  hasBlockStyle,
  HeadingWithoutImage,
  isBreakBlock
} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'

// Main
export const isPrimaryBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Primary Bg'), hasBlockStyle('Schwarz Bg')]), isBreakBlock])(
    block
  )

export const isSecondaryBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Secondary Bg'), hasBlockStyle('Pink Bg')]), isBreakBlock])(block)

export const isAccentBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Accent Bg'), hasBlockStyle('Türkis Bg')]), isBreakBlock])(block)

export const isLightAccentBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Light Accent Bg'), hasBlockStyle('Gelb Bg')]), isBreakBlock])(
    block
  )

// Sub
export const isVioletBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Violett Bg'), isBreakBlock])(block)

export const isPurpleBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Lila Bg'), isBreakBlock])(block)

export const isWarningBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Warning Bg'), hasBlockStyle('Orange Bg')]), isBreakBlock])(block)

export const isErrorBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Error Bg'), hasBlockStyle('Rot Bg')]), isBreakBlock])(block)

export const isSuccessBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Success Bg'), hasBlockStyle('Grün Bg')]), isBreakBlock])(block)

export const isInfoBreakBlock = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([anyPass([hasBlockStyle('Info Bg'), hasBlockStyle('Blau Bg')]), isBreakBlock])(block)

export const MannschaftBreakBlock = styled(BreakBlock)`
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr max-content;
    gap: ${({theme}) => theme.spacing(4)};
  }

  ${HeadingWithoutImage} {
    font-size: ${({theme}) => theme.typography.h3.fontSize};
  }
`
