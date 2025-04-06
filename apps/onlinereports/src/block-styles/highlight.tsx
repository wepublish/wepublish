import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserGridBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
  TeaserGridBlockWrapper
} from '@wepublish/block-content/website'
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
  TeaserSlotsBlock
} from '@wepublish/website/api'
import {BuilderTeaserGridBlockProps, BuilderTeaserListBlockProps} from '@wepublish/website/builder'
import {allPass, anyPass} from 'ramda'

import {HighlightTeaser} from '../custom-teasers/highlight'

export const isHighlightTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock | TeaserSlotsBlock =>
  allPass([
    hasBlockStyle('Highlight'),
    anyPass([isTeaserGridBlock, isTeaserListBlock, isTeaserSlotsBlock])
  ])(block)

export const HighlightBlockStyle = ({
  teasers,
  blockStyle,
  className
}: BuilderTeaserGridBlockProps | BuilderTeaserListBlockProps) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1

  return (
    <TeaserGridBlockWrapper className={className} numColumns={numColumns}>
      {filledTeasers.map((teaser, index) => (
        <HighlightTeaser
          key={index}
          teaser={teaser}
          numColumns={numColumns}
          alignment={alignmentForTeaserBlock(index, numColumns)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridBlockWrapper>
  )
}
