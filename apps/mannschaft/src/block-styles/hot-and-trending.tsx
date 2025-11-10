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
  CustomTeaser,
  Teaser,
  TeaserGridBlock,
  TeaserListBlock,
  TeaserType,
} from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass, anyPass, compose, insert } from 'ramda';

export const isHotAndTrendingTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
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
    insert<Teaser>(1, {
      type: TeaserType.Custom,
      properties: [],
      contentUrl: '',
      preTitle: 'hot-and-trending',
      title: 'Trending',
      lead: null,
      image: null,
    } as CustomTeaser),
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
