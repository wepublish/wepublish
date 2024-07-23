import {css, Theme, useTheme} from '@mui/material'
import {
  BlockRenderer,
  BreakBlockWrapper,
  BuilderBlockRendererProps,
  isFocusTeaserBlockStyle,
  isTeaserSliderBlockStyle,
  SliderBall,
  TeaserTitle
} from '@wepublish/website'
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

const seamlessBackground = (theme: Theme) => css`
  margin-top: -${theme.spacing(7)};
  margin-bottom: -${theme.spacing(7)};

  &:has(+ * > ${BreakBlockWrapper}) {
    margin-bottom: 0;
  }

  &:last-child {
    margin-bottom: -${theme.spacing(3)};
  }
`

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
        [
          isTeaserSliderBlockStyle,
          () => css`
            padding-top: ${theme.spacing(6)};
            padding-bottom: ${theme.spacing(6)};
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};

            ${TeaserTitle} {
              color: ${theme.palette.secondary.main};
            }

            ${SliderBall} {
              color: ${theme.palette.secondary.main};
            }
          `
        ],
        // Break Blocks
        [
          isPrimaryBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};
          `
        ],
        [
          isSecondaryBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.secondary.contrastText};
            background-color: ${theme.palette.secondary.main};
          `
        ],
        [
          isAccentBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.accent.contrastText};
            background-color: ${theme.palette.accent.main};
          `
        ],
        [
          isLightAccentBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.accent.contrastText};
            background-color: ${theme.palette.accent.light};
          `
        ],
        [
          isVioletBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.getContrastText('#945fa4')};
            background-color: #945fa4;
          `
        ],
        [
          isPurpleBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.getContrastText('#831d81')};
            background-color: #831d81;
          `
        ],
        [
          isInfoBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.info.contrastText};
            background-color: ${theme.palette.info.main};
          `
        ],
        [
          isSuccessBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.success.contrastText};
            background-color: ${theme.palette.success.main};
          `
        ],
        [
          isSuccessBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.success.contrastText};
            background-color: ${theme.palette.success.main};
          `
        ],
        [
          isWarningBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.warning.contrastText};
            background-color: ${theme.palette.warning.main};
          `
        ],
        [
          isErrorBreakBlock,
          () => css`
            ${seamlessBackground(theme)}
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