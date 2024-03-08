import {
  BlockRenderer,
  BuilderBlockRendererProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

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
    blocks: {TeaserGrid}
  } = useWebsiteBuilder()

  const extraBlockMap = useMemo(
    () =>
      cond([
        [isContextBox, block => <ContextBox {...block} />],
        [isTeaserSlider, block => <TeaserSlider {...block} />],
        [isBestOfWePublish, block => <BestOfWePublish {...block} />],
        [isAnyBriefing, block => <BaselBriefing {...(block as BaselBriefingProps)} />],
        [isArchive, block => <Archive {...block} />],
        [
          isWideTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{Teaser: WideTeaser}}>
              <TeaserGrid {...block} />
            </WebsiteBuilderProvider>
          )
        ],
        [
          isSmallTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{Teaser: SmallTeaser}}>
              <TeaserGrid {...block} />
            </WebsiteBuilderProvider>
          )
        ]
      ]),
    [TeaserGrid]
  )

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
