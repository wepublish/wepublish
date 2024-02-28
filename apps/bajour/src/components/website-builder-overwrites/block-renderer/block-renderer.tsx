import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'

import {BestOfWePublish} from '../../bajour/best-of-wepublish/best-of-wepublish'
import {isBestOfWePublish} from '../../bajour/best-of-wepublish/is-best-of-wepublish'
import {BaselBriefing, BaselBriefingProps} from '../../bajour/briefing/basel-briefing'
import {isAnyBriefing} from '../../bajour/briefing/is-briefing'
import {isTeaserSlider, TeaserSlider} from '../blocks/teaser-slider/teaser-slider'

const extraBlockMap = cond([
  [isTeaserSlider, block => <TeaserSlider {...block} />],
  [isBestOfWePublish, block => <BestOfWePublish {...block} />],
  [isAnyBriefing, block => <BaselBriefing {...(block as BaselBriefingProps)} />]
])

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
