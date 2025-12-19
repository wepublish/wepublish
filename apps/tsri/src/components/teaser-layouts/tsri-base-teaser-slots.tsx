import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  alignmentForTeaserBlock as alignmentForTeaserBlockFullsizeImage,
  isTeaserSlotsFullsizeImage,
  TeaserSlotsFullsizeImage,
} from './layout-fullsize-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockTeaserSlotsHeroTeaser,
  isTeaserSlotsHeroTeaser,
  TeaserSlotsHeroTeaser,
} from './layout-hero-teaser';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImage,
  isTeaserSlotNoImage,
  TeaserSlotNoImage,
} from './layout-no-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImageAltColor,
  isTeaserSlotNoImageAltColor,
  TeaserSlotNoImageAltColor,
} from './layout-no-image-alt-color';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockDailyBriefingSidebar,
  isTeaserSlotsDailyBriefingSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexDailyBriefingSidebar,
  TeaserSlotsDailyBriefingSidebar,
} from './layout-sidebar-daily-briefing';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockFocusMonthSidebar,
  isTeaserSlotsFocusMonthSidebar,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexFocusMonthSidebar,
  TeaserSlotsFocusMonthSidebar,
} from './layout-sidebar-focus-month';
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
  alignmentForTeaserBlock as alignmentForTeaserBlockTwoCol,
  isTeaserSlotsTwoCol,
  TeaserSlotsTwoCol,
} from './layout-two-col';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockTwoColAltColor,
  isTeaserSlotsTwoColAltColor,
  TeaserSlotsTwoColAltColor,
} from './layout-two-col-alt-color';
import {
  alignmentForTeaserBlock,
  isTeaserSlotsArchiveTopic,
  teaserBlockStyleByIndex,
  TeaserSlotsArchiveTopic,
} from './teaser-slots-archive-topic';
import {
  isTeaserSlotsArchiveTopicAuthor,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexAuthor,
  TeaserSlotsArchiveTopicAuthor,
} from './teaser-slots-archive-topic-author';
import {
  isTeaserSlotsArchiveTopicWithTwoCol,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexWithTwoCol,
  TeaserSlotsArchiveTopicWithTwoCol,
} from './teaser-slots-archive-topic-with-two-col';

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
        alignmentForTeaserBlock={alignmentForTeaserBlockTeaserSlotsHeroTeaser}
      />
    ),
  ],
  [
    isTeaserSlotsFocusMonthSidebar,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsFocusMonthSidebar
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexFocusMonthSidebar}
        alignmentForTeaserBlock={alignmentForTeaserBlockFocusMonthSidebar}
      />
    ),
  ],
  [
    isTeaserSlotsFullsizeImage,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsFullsizeImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockFullsizeImage}
      />
    ),
  ],
  [
    isTeaserSlotsTwoCol,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsTwoCol
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockTwoCol}
      />
    ),
  ],
  [
    isTeaserSlotNoImage,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotNoImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImage}
      />
    ),
  ],
  [
    isTeaserSlotNoImageAltColor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotNoImageAltColor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImageAltColor}
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
    isTeaserSlotsTwoColAltColor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsTwoColAltColor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockTwoColAltColor}
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
