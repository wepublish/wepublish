import {css, Theme, useTheme} from '@mui/material'
import styled from '@emotion/styled'
import {
  BlockRenderer,
  BuilderBlockRendererProps,
  ImageWrapper,
  isImageSliderBlockStyle,
  isTeaserSliderBlockStyle,
  SliderBall
} from '@wepublish/website'
import {anyPass, cond} from 'ramda'
import {useMemo} from 'react'

import {
  isAccentBg,
  isAccentFg,
  isAccentLightBg,
  isAccentLightFg,
  isPrimaryBg,
  isPrimaryFg,
  isSecondaryBg,
  isSecondaryFg
} from './kolumna-general-block-styles'
import {MainSpacer} from './main-spacer'

const isSeamless = anyPass([
  isImageSliderBlockStyle,
  isTeaserSliderBlockStyle,
  isPrimaryBg,
  isSecondaryBg,
  isAccentBg,
  isAccentLightBg
])

const seamlessBackground = (theme: Theme) => css`
  padding-top: ${theme.spacing(6)};
  padding-bottom: ${theme.spacing(6)};

  &:has(+ .seamless-block) {
    margin-bottom: -${theme.spacing(7)};
  }

  &:last-child {
    margin-bottom: -${theme.spacing(3)};
  }
`

export const KolumnaBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme()

  const styles = useMemo(
    () =>
      cond([
        [
          anyPass([isImageSliderBlockStyle, isTeaserSliderBlockStyle]),
          () => css`
            ${seamlessBackground(theme)}

            color: ${theme.palette.getContrastText(theme.palette.accent.light!)};
            background-color: ${theme.palette.accent.light};

            ${SliderBall} {
              color: ${theme.palette.secondary.main};
              background-color: ${theme.palette.common.white};
            }

            ${ImageWrapper} {
              aspect-ratio: unset;
              max-height: unset;
            }
          `
        ],
        [
          isPrimaryBg,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.primary.contrastText};
            background-color: ${theme.palette.primary.main};
          `
        ],
        [
          isPrimaryFg,
          () => css`
            color: ${theme.palette.primary.main};
          `
        ],
        [
          isSecondaryBg,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.secondary.contrastText};
            background-color: ${theme.palette.secondary.main};
          `
        ],
        [
          isSecondaryFg,
          () => css`
            color: ${theme.palette.secondary.main};
          `
        ],
        [
          isAccentBg,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.accent.contrastText};
            background-color: ${theme.palette.accent.main};
          `
        ],
        [
          isAccentFg,
          () => css`
            color: ${theme.palette.accent.main};
          `
        ],
        [
          isAccentLightBg,
          () => css`
            ${seamlessBackground(theme)}
            color: ${theme.palette.getContrastText(theme.palette.accent.light!)};
            background-color: ${theme.palette.accent.light};
          `
        ],
        [
          isAccentLightFg,
          () => css`
            color: ${theme.palette.secondary.light};
          `
        ]
      ]),
    [theme]
  )

  const blockContent = <BlockRenderer {...props} />

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
        className={isSeamless(props.block) ? 'seamless-block' : undefined}>
        {blockContent}
      </MainSpacer>
    )
  }

  return blockContent
}
