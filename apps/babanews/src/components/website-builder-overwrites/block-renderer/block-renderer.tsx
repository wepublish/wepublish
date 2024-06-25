import {useTheme} from '@mui/material'
import {
  alignmentForTeaserBlock,
  BlockRenderer,
  BreakBlock,
  BuilderBlockRendererProps,
  isBreakBlock,
  isTeaserListBlock
} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {FullWidthBanner} from '../../babanews/fullwidth-banner/fullwidth-banner'
import {isFullWidthBanner} from '../../babanews/fullwidth-banner/is-fullwidth-banner'
import {InstagramBanner} from '../../babanews/instagram-banner/instagram-banner'
import {isInstagramBanner} from '../../babanews/instagram-banner/is-instagram-banner'
import {Container} from '../../layout/container'
import {FullWidthContainer} from '../../layout/full-width-container'
import {BabanewsTeaserList} from '../../website-builder-styled/blocks/teaser-list-styled'
import {ListTeaser} from '../blocks/list-teaser'

export const BabanewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme()

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
        ],
        [
          isBreakBlock,
          block => (
            <FullWidthContainer backgroundColor={theme.palette.accent.main}>
              <Container>
                <BreakBlock {...block} />
              </Container>
            </FullWidthContainer>
          )
        ],
        [
          isTeaserListBlock,
          block => (
            <Container>
              <BabanewsTeaserList>
                {block.teasers.map((teaser, index) => (
                  <ListTeaser
                    blockStyle={block.blockStyle}
                    teaser={teaser}
                    key={index}
                    alignment={alignmentForTeaserBlock(index, 1)}
                  />
                ))}
              </BabanewsTeaserList>
            </Container>
          )
        ]
      ]),
    [theme.palette.accent.main, theme.palette.common.black]
  )

  return (
    extraBlockMap(props.block) ?? (
      <Container>
        <BlockRenderer {...props} />
      </Container>
    )
  )
}
