import {BlockContent, TeaserGridBlock} from '@wepublish/website/api'
import {allPass} from 'ramda'
import {hasBlockStyle} from '../../has-blockstyle'
import {isTeaserGridBlock} from '../../teaser/teaser-grid-block'
import {BuilderTeaserProps} from '@wepublish/website/builder'

export const isAlternating = hasBlockStyle('Alternating')
export const isAlternatingTeaser = (props: BuilderTeaserProps) => isAlternating(props)

export const isAlternatingTeaserBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock => allPass([isAlternating, isTeaserGridBlock])(block)
