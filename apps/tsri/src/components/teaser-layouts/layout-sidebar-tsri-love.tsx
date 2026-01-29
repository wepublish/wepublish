import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { StyledTeaserTopicMeta } from '../teasers/teaser-topic-meta';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserPreTitle } from '../teasers/tsri-teaser';
import { TsriLayoutType } from './tsri-layout';
import { TeaserSlots } from './tsri-layout';

export const isTeaserSlotsTsriLoveSidebar = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.TsriLove;
  },
]);

export const teaserBlockStyleByIndex = (
  index: number,
  count?: number
): TsriTeaserType => {
  switch (index) {
    case count! - 1:
      return TsriTeaserType.TopicMeta;
    default:
      return TsriTeaserType.TsriLove;
  }
};

export const alignmentForTeaserBlock = (index: number) => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 1, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  switch (index) {
    default:
      return { ...alignment, y: index };
  }
};

export const TeaserSlotsTsriLoveSidebar = styled(TeaserSlots)`
  margin: 0;
  padding: 0;
  row-gap: 0.2cqw;
  height: 100%;
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  ${StyledTeaserTopicMeta} {
    margin-top: 2cqw;
    flex-grow: 1;

    ${TeaserPreTitle} {
      & .MuiLink-root {
        &:hover {
          background-color: ${({ theme }) => theme.palette.primary.light};
          color: ${({ theme }) => theme.palette.common.black};
        }
      }
    }
  }
`;
