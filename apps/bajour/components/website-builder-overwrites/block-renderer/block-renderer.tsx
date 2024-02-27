import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'

import {isTeaserSlider, TeaserSlider} from '../blocks/teaser-slider/teaser-slider'

const extraBlockMap = cond([[isTeaserSlider, block => <TeaserSlider {...block} />]])

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
