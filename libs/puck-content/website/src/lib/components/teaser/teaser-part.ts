import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTags,
  selectTeaserTitle,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';

import { TeaserSlotValue } from '../../contexts/teaser-slot.context';

export type TeaserPartType =
  | 'TeaserTitle'
  | 'TeaserPreTitle'
  | 'TeaserLead'
  | 'TeaserImage'
  | 'TeaserAuthors'
  | 'TeaserDate'
  | 'TeaserTags';

export type HideWhenEmptyProps = {
  hideWhenEmpty?: boolean;
};

const hasTeaserPart: Record<
  TeaserPartType,
  (teaser: FullTeaserFragment) => boolean
> = {
  TeaserTitle: teaser => !!selectTeaserTitle(teaser),
  TeaserPreTitle: teaser => !!selectTeaserPreTitle(teaser),
  TeaserLead: teaser => !!selectTeaserLead(teaser),
  TeaserImage: teaser => !!selectTeaserImage(teaser),
  TeaserAuthors: teaser => !!selectTeaserAuthors(teaser)?.length,
  TeaserDate: teaser => !!selectTeaserDate(teaser),
  TeaserTags: teaser => !!selectTeaserTags(teaser).length,
};

export const isTeaserPartEmpty = (
  part: TeaserPartType,
  teaser: TeaserSlotValue
) => !teaser || !hasTeaserPart[part](teaser);
