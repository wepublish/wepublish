import {
  alignmentForTeaserBlock,
  ApiV1,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserGridBlock,
  isTeaserListBlock,
  TeaserGridBlockWrapper,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass, anyPass, compose, insert} from 'ramda'

export const isHotAndTrendingTeasers = (
  block: ApiV1.Block
): block is ApiV1.TeaserGridBlock | ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('Hot & Trending'), anyPass([isTeaserGridBlock, isTeaserListBlock])])(block)

export const HotAndTrendingBlockStyle = ({
  teasers,
  blockStyle,
  className,
  ...props
}: BuilderTeaserGridBlockProps | BuilderTeaserListBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  const filledTeasers = compose(
    insert<ApiV1.Teaser>(1, {
      __typename: 'CustomTeaser',
      properties: [],
      contentUrl: '',
      preTitle: 'hot-and-trending',
      title: 'Hot & Trending',
      lead: null,
      image: null,
      style: ApiV1.TeaserStyle.Default
    } as ApiV1.CustomTeaser),
    (t: typeof teasers) => t.filter(isFilledTeaser)
  )(teasers)

  return (
    <TeaserGridBlockWrapper className={className} numColumns={2}>
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          numColumns={2}
          alignment={alignmentForTeaserBlock(index, 2)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridBlockWrapper>
  )
}
