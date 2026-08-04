import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserGridBlock,
  isTeaserListBlock,
  TeaserGridBlockWrapper,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserFragment,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
  TeaserType,
} from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass, anyPass, compose, insert } from 'ramda';

export const isHotAndTrendingTeasers = (
  block: Pick<BlockContent, '__typename'>
): block is FullTeaserGridBlockFragment | FullTeaserListBlockFragment =>
  allPass([
    hasBlockStyle('Hot & Trending'),
    anyPass([isTeaserGridBlock, isTeaserListBlock]),
  ])(block);

export const HotAndTrendingBlockStyle = ({
  teasers,
  blockStyle,
  className,
}: BuilderTeaserGridBlockProps | BuilderTeaserListBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = compose(
    insert<FullTeaserFragment>(1, {
      type: TeaserType.Custom,
      properties: [],
      contentUrl: '',
      preTitle: 'hot-and-trending',
      title: 'Trending',
      lead: null,
      image: null,
    }),
    (t: typeof teasers) => t.filter(isFilledTeaser)
  )(teasers);

  return (
    <TeaserGridBlockWrapper
      className={className}
      numColumns={2}
    >
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          numColumns={2}
          index={index}
          alignment={alignmentForTeaserBlock(index, 2)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridBlockWrapper>
  );
};
