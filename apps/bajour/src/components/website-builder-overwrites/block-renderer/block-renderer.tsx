import {
  BlockRenderer,
  isTeaserGridBlock,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserGridBlock } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { allPass, cond } from 'ramda';
import { Fragment, useCallback, useMemo } from 'react';

import { Archive } from '../../archive/archive';
import { isArchive } from '../../archive/is-archive';
import { BestOfWePublish } from '../../best-of-wepublish/best-of-wepublish';
import { isBestOfWePublish } from '../../best-of-wepublish/is-best-of-wepublish';
import {
  BaselBriefing,
  BaselBriefingProps,
} from '../../briefing/basel-briefing';
import { isAnyBriefing } from '../../briefing/is-briefing';
import { FrageDesTages } from '../../frage-des-tages/frage-des-tages';
import { isFrageDesTages } from '../../frage-des-tages/is-frage-des-tages';
import { isSearchSlider } from '../../search-slider/is-search-slider';
import { SearchSliderBlock } from '../../search-slider/search-slider-block';
import { isSmallTeaser, SmallTeaser } from '../blocks/small-teaser';
import { isWideTeaser, WideTeaser } from '../blocks/wide-teaser';
import {
  BajourLightBreakBlock,
  BajourSponsoredBreakBlock,
  isLightBreak,
  isSponsoredBreak,
} from '../break/bajour-break';

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: { TeaserGrid, TeaserList },
  } = useWebsiteBuilder();

  // Bajour has some old related articles teasers and we do not want them to show up
  // They are hidden for now instead of removed from the API as we will migrate these to article metadata at some point.
  // This allows us to show predefined related articles & enhance it with automatic generated once.
  const isOldRelatedArticles = useCallback(
    (block: Pick<BlockContent, '__typename'>): block is TeaserGridBlock =>
      allPass([
        isTeaserGridBlock,
        () => props.type === 'Article' && props.index === props.count - 1,
      ])(block),
    [props.index, props.count, props.type]
  );

  const extraBlockMap = useMemo(
    () =>
      cond([
        [isOldRelatedArticles, block => <Fragment />],
        [isFrageDesTages, block => <FrageDesTages {...block} />],
        [isSearchSlider, block => <SearchSliderBlock {...block} />],
        [isBestOfWePublish, block => <BestOfWePublish {...block} />],
        [
          isAnyBriefing,
          block => <BaselBriefing {...(block as BaselBriefingProps)} />,
        ],
        [isArchive, block => <Archive {...block} />],
        [
          isWideTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{ Teaser: WideTeaser }}>
              {isTeaserGridBlock(block) && <TeaserGrid {...block} />}
              {isTeaserListBlock(block) && <TeaserList {...block} />}
            </WebsiteBuilderProvider>
          ),
        ],
        [
          isSmallTeaser,
          block => (
            <WebsiteBuilderProvider blocks={{ Teaser: SmallTeaser }}>
              {isTeaserGridBlock(block) && <TeaserGrid {...block} />}
              {isTeaserListBlock(block) && <TeaserList {...block} />}
            </WebsiteBuilderProvider>
          ),
        ],
        [isLightBreak, block => <BajourLightBreakBlock {...block} />],
        [isSponsoredBreak, block => <BajourSponsoredBreakBlock {...block} />],
      ]),
    [TeaserGrid, TeaserList, isOldRelatedArticles]
  );

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />;
};
