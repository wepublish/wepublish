import {useTheme} from '@mui/material'
import {BlockRenderer, BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {FullWidthBanner} from '../../babanews/fullwidth-banner/fullwidth-banner'
import {isFullWidthBanner} from '../../babanews/fullwidth-banner/is-fullwidth-banner'
import {InstagramBanner} from '../../babanews/instagram-banner/instagram-banner'
import {isInstagramBanner} from '../../babanews/instagram-banner/is-instagram-banner'
import {Container} from '../../layout/container'
import {FullWidthContainer} from '../../layout/full-width-container'

export const BabanewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme()
  const {
    blocks: {TeaserGrid}
  } = useWebsiteBuilder()

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isFullWidthBanner,
          block => (
            <FullWidthContainer>
              <Container>
                <FullWidthBanner {...block} />
              </Container>
            </FullWidthContainer>
          )
        ],
        [
          isInstagramBanner,
          block => (
            <FullWidthContainer backgroundColor={theme.palette.common.black}>
              <Container>
                <InstagramBanner {...block} />
              </Container>
            </FullWidthContainer>
          )
        ]
      ]),
    [TeaserGrid]
  )

  return (
    extraBlockMap(props.block) ?? (
      <Container>
        <BlockRenderer {...props} />
      </Container>
    )
  )
}
