import {
  ApiV1,
  BlockRenderer,
  BuilderBlockRendererProps,
  isTeaserGridBlock,
  isTeaserListBlock,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {allPass, cond} from 'ramda'
import {Fragment, useCallback, useMemo} from 'react'

import {Archive} from '../../bajour/archive/archive'
import {isArchive} from '../../bajour/archive/is-archive'
import {BestOfWePublish} from '../../bajour/best-of-wepublish/best-of-wepublish'
import {isBestOfWePublish} from '../../bajour/best-of-wepublish/is-best-of-wepublish'
import {BaselBriefing, BaselBriefingProps} from '../../bajour/briefing/basel-briefing'
import {isAnyBriefing} from '../../bajour/briefing/is-briefing'
import {ContextBox} from '../../bajour/context-box/context-box'
import {isContextBox} from '../../bajour/context-box/is-context-box'
import {isSmallTeaser, SmallTeaser} from '../blocks/small-teaser'
import {isTeaserSlider, TeaserSlider} from '../blocks/teaser-slider/teaser-slider'
import {isWideTeaser, WideTeaser} from '../blocks/wide-teaser'

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: {TeaserGrid, TeaserList}
  } = useWebsiteBuilder()

  // Bajour has some old related articles teasers and we do not want them to show up
  // They are hidden for now instead of removed from the API as we will migrate these to article metadata at some point.
  // This allows us to show predefined related articles & enhance it with automatic generated once.
  const isOldRelatedArticles = useCallback(
    (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
      allPass([
        isTeaserGridBlock,
        () => props.type === 'Article' && props.index === props.count - 1
      ])(block),
    [props.index, props.count, props.type]
  )

  const extraBlockMap = useMemo(
    () =>
      cond([
        [isOldRelatedArticles, block => <Fragment />],
        [isContextBox, block => <ContextBox {...block} />],
        [isTeaserSlider, block => <TeaserSlider {...block} />],
        [isBestOfWePublish, block => <BestOfWePublish {...block} />],
        [isAnyBriefing, block => <BaselBriefing {...(block as BaselBriefingProps)} />],
        [isArchive, block => <Archive {...block} />],
        [
          isWideTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{Teaser: WideTeaser}}>
              {isTeaserGridBlock(block) && <TeaserGrid {...block} />}
              {isTeaserListBlock(block) && <TeaserList {...block} />}
            </WebsiteBuilderProvider>
          )
        ],
        [
          isSmallTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{Teaser: SmallTeaser}}>
              {isTeaserGridBlock(block) && <TeaserGrid {...block} />}
              {isTeaserListBlock(block) && <TeaserList {...block} />}
            </WebsiteBuilderProvider>
          )
        ]
      ]),
    [TeaserGrid, TeaserList, isOldRelatedArticles]
  )

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
