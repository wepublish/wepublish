import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'

import {BaselBriefing, isBaselBriefing} from '../../bajour'

const extraBlockMap = cond([[isBaselBriefing, block => <BaselBriefing {...block} />]])

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
