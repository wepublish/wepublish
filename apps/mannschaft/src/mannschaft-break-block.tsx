import {styled} from '@mui/material'
import {
  BreakBlock,
  hasBlockStyle,
  HeadingWithoutImage,
  isBreakBlock
} from '@wepublish/block-content/website'
import {BlockContent, BreakBlock as BreakBlockType} from '@wepublish/website/api'
import {allPass, anyPass} from 'ramda'

// Main
export const isPrimaryBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Primary Bg'), hasBlockStyle('Schwarz Bg')]), isBreakBlock])(
    block
  )

export const isSecondaryBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Secondary Bg'), hasBlockStyle('Pink Bg')]), isBreakBlock])(block)

export const isAccentBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Accent Bg'), hasBlockStyle('Türkis Bg')]), isBreakBlock])(block)

export const isLightAccentBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Light Accent Bg'), hasBlockStyle('Gelb Bg')]), isBreakBlock])(
    block
  )

// Sub
export const isVioletBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([hasBlockStyle('Violett Bg'), isBreakBlock])(block)

export const isPurpleBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([hasBlockStyle('Lila Bg'), isBreakBlock])(block)

export const isWarningBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Warning Bg'), hasBlockStyle('Orange Bg')]), isBreakBlock])(block)

export const isErrorBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Error Bg'), hasBlockStyle('Rot Bg')]), isBreakBlock])(block)

export const isSuccessBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Success Bg'), hasBlockStyle('Grün Bg')]), isBreakBlock])(block)

export const isInfoBreakBlock = (block: BlockContent): block is BreakBlockType =>
  allPass([anyPass([hasBlockStyle('Info Bg'), hasBlockStyle('Blau Bg')]), isBreakBlock])(block)

export const MannschaftBreakBlock = styled(BreakBlock)`
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr max-content;
    gap: ${({theme}) => theme.spacing(4)};
  }

  ${HeadingWithoutImage} {
    font-size: ${({theme}) => theme.typography.h3};
  }
`
