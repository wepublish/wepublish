import {BlockRenderer, BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {FullWidthBanner} from '../../babanews/fullwidth-banner/fullwidth-banner'
import {isFullWidthBanner} from '../../babanews/fullwidth-banner/is-fullwidth-banner'
import {Container} from '../../layout/container'
import {FullWidthContainer} from '../../layout/full-width-container'

export const BabanewsBlockRenderer = (props: BuilderBlockRendererProps) => {
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
