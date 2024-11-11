import {css, Theme, useTheme} from '@mui/material'
import {
  BlockRenderer,
  BuilderBlockRendererProps,
  isImageSliderBlockStyle,
  isTeaserSliderBlockStyle,
  SliderBall,
  SliderWrapper
} from '@wepublish/website'
import {anyPass, cond} from 'ramda'
import {useMemo} from 'react'

import {MainSpacer} from './main-spacer'

const seamlessBackground = (theme: Theme) => css`
  &:has(+ * > :is(${SliderWrapper})) {
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
            padding-top: ${theme.spacing(6)};
            padding-bottom: ${theme.spacing(6)};
            color: ${theme.palette.getContrastText(theme.palette.accent.light!)};
            background-color: ${theme.palette.accent.light};

            ${SliderBall} {
              color: ${theme.palette.secondary.main};
              background-color: ${theme.palette.common.white};
            }
          `
        ]
      ]),
    [theme]
  )

  const blockContent = <BlockRenderer {...props} />

  if (props.type === 'Page') {
    return (
      <MainSpacer maxWidth="lg" css={styles(props.block)}>
        {blockContent}
      </MainSpacer>
    )
  }

  return blockContent
}
