import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  alignmentForTeaserBlock,
  isTeaserSlotsArchiveTopic,
  teaserBlockStyleByIndex,
  TeaserSlotsArchiveTopic,
} from './layout-archive-topic';
import {
  isTeaserSlotsArchiveTopicAuthor,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexAuthor,
  TeaserSlotsArchiveTopicAuthor,
} from './layout-archive-topic-author';
import {
  isTeaserSlotsArchiveTopicWithTwoCol,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexWithTwoCol,
  TeaserSlotsArchiveTopicWithTwoCol,
} from './layout-archive-topic-with-two-col';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockDefault,
  TeaserSlotsDefault,
} from './layout-default';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockTeaserSlotsHeroTeaser,
  isTeaserSlotsHeroTeaser,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexHeroTeaser,
  TeaserSlotsHeroTeaser,
} from './layout-hero-teaser';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockDailyBriefingSidebar,
  isTeaserSlotsDailyBriefingSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexDailyBriefingSidebar,
  TeaserSlotsDailyBriefingSidebar,
} from './layout-sidebar-daily-briefing';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockEventsSidebar,
  isTeaserSlotsEventsSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexEventsSidebar,
  TeaserSlotsEventsSidebar,
} from './layout-sidebar-events';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockShopProductsSidebar,
  isTeaserSlotsShopProductsSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexShopProductsSidebar,
  TeaserSlotsShopProductsSidebar,
} from './layout-sidebar-shop-products';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockTsriLoveSidebar,
  isTeaserSlotsTsriLoveSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexTsriLoveSidebar,
  TeaserSlotsTsriLoveSidebar,
} from './layout-sidebar-tsri-love';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockXLFullsizeImageTeasers,
  isTeaserSlotsXLFullsizeImageTeasers,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexXLFullsizeImageTeasers,
  TeaserSlotsXLFullsizeImage,
} from './layout-xl-fullsize-image-teasers';

export const TsriBaseTeaserSlots = cond([
  [
    isTeaserSlotsTsriLoveSidebar,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsTsriLoveSidebar
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexTsriLoveSidebar}
        alignmentForTeaserBlock={alignmentForTeaserBlockTsriLoveSidebar}
      />
    ),
  ],
  [
    isTeaserSlotsShopProductsSidebar,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsShopProductsSidebar
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexShopProductsSidebar}
        alignmentForTeaserBlock={alignmentForTeaserBlockShopProductsSidebar}
      />
    ),
  ],
  [
    isTeaserSlotsDailyBriefingSidebar,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsDailyBriefingSidebar
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexDailyBriefingSidebar}
        alignmentForTeaserBlock={alignmentForTeaserBlockDailyBriefingSidebar}
      />
    ),
  ],
  [
    isTeaserSlotsHeroTeaser,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsHeroTeaser
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexHeroTeaser}
        alignmentForTeaserBlock={alignmentForTeaserBlockTeaserSlotsHeroTeaser}
      />
    ),
  ],
  [
    isTeaserSlotsXLFullsizeImageTeasers,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsXLFullsizeImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockXLFullsizeImageTeasers}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexXLFullsizeImageTeasers}
      />
    ),
  ],
  [
    isTeaserSlotsEventsSidebar,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsEventsSidebar
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexEventsSidebar}
        alignmentForTeaserBlock={alignmentForTeaserBlockEventsSidebar}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopic,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopic
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndex}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicAuthor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicAuthor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexAuthor}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicWithTwoCol,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicWithTwoCol
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexWithTwoCol}
      />
    ),
  ],
  [
    T,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsDefault
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockDefault}
      />
    ),
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
  [
    T,
    props => (
      <div>
        TsriTeaserSlots fallback - unknown TeaserSlots type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
