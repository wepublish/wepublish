import {
  alignmentForTeaserBlock,
  ApiV1,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserGridBlock,
  isTeaserListBlock,
  TeaserGridBlockWrapper
} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'

import {HighlightTeaser} from '../custom-teasers/highlight'

export const isHighlightTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('Highlight'), anyPass([isTeaserGridBlock, isTeaserListBlock])])(block)

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
