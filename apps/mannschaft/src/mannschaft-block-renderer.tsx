import {css, useTheme} from '@mui/material'
import {BlockRenderer, BuilderBlockRendererProps, isFocusTeaserBlockStyle} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {HighlightBlockStyle, isHighlightTeasers} from './block-styles/highlight'
import {HotAndTrendingBlockStyle, isHotAndTrendingTeasers} from './block-styles/hot-and-trending'
import {MainSpacer} from './main-spacer'
import {
  isAccentBreakBlock,
  isErrorBreakBlock,
  isInfoBreakBlock,
  isLightAccentBreakBlock,
  isPrimaryBreakBlock,
  isPurpleBreakBlock,
  isSecondaryBreakBlock,
  isSuccessBreakBlock,
  isVioletBreakBlock,
  isWarningBreakBlock
} from './mannschaft-break-block'

export const MannschaftBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme()

  const extraBlockMap = useMemo(
    () =>
      cond([
        [isHotAndTrendingTeasers, block => <HotAndTrendingBlockStyle {...block} />],
        [isHighlightTeasers, block => <HighlightBlockStyle {...block} />]
      ]),
    []
  )

  const styles = useMemo(
    () =>
      cond([
        [
          isFocusTeaserBlockStyle,
          () => css`
            padding-top: ${theme.spacing(6)};
            padding-bottom: ${theme.spacing(6)};
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};
          `
        ],
        // Break Blocks
        [
          isPrimaryBreakBlock,
          () => css`
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};
          `
        ],
        [
          isSecondaryBreakBlock,
          () => css`
            color: ${theme.palette.secondary.contrastText};
            background-color: ${theme.palette.secondary.main};
          `
        ],
        [
          isAccentBreakBlock,
          () => css`
            color: ${theme.palette.accent.contrastText};
            background-color: ${theme.palette.accent.main};
          `
        ],
        [
          isLightAccentBreakBlock,
          () => css`
            color: ${theme.palette.accent.contrastText};
            background-color: ${theme.palette.accent.light};
          `
        ],
        [
          isVioletBreakBlock,
          () => css`
            color: ${theme.palette.getContrastText('#945fa4')};
            background-color: #945fa4;
          `
        ],
        [
          isPurpleBreakBlock,
          () => css`
            color: ${theme.palette.getContrastText('#831d81')};
            background-color: #831d81;
          `
        ],
        [
          isInfoBreakBlock,
          () => css`
            color: ${theme.palette.info.contrastText};
            background-color: ${theme.palette.info.main};
          `
        ],
        [
          isSuccessBreakBlock,
          () => css`
            color: ${theme.palette.success.contrastText};
            background-color: ${theme.palette.success.main};
          `
        ],
        [
          isSuccessBreakBlock,
          () => css`
            color: ${theme.palette.success.contrastText};
            background-color: ${theme.palette.success.main};
          `
        ],
        [
          isWarningBreakBlock,
          () => css`
            color: ${theme.palette.warning.contrastText};
            background-color: ${theme.palette.warning.main};
          `
        ],
        [
          isErrorBreakBlock,
          () => css`
            color: ${theme.palette.error.contrastText};
            background-color: ${theme.palette.error.main};
          `
        ]
      ]),
    [theme]
  )

  const blockContent = extraBlockMap(props.block) ?? <BlockRenderer {...props} />

  if (props.type === 'Page') {
    return (
      <MainSpacer maxWidth="lg" css={styles(props.block)}>
        {blockContent}
      </MainSpacer>
    )
  }

  return blockContent
}
