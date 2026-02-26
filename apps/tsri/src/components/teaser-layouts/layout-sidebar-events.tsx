import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { StyledTeaserTopicMeta } from '../teasers/teaser-topic-meta';
import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserPreTitle } from '../teasers/tsri-teaser';
import { TsriLayoutType } from './tsri-layout';
import { TeaserSlots } from './tsri-layout';

export const isTeaserSlotsEventsSidebar = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.Events;
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
      return TsriTeaserType.Events;
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

export const TeaserSlotsEventsSidebar = styled(TeaserSlots)`
  margin: 0;
  padding: 0;
  row-gap: calc(var(--sizing-factor) * 0.2cqw);
  height: 100%;
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  ${StyledTeaserTopicMeta} {
    margin-top: calc(var(--sizing-factor) * 2cqw);
    flex-grow: 1;

    ${TeaserPreTitle} {
      & .MuiLink-root {
        &:hover {
          background-color: ${({ theme }) => theme.palette.primary.main};
          color: ${({ theme }) => theme.palette.common.white};
        }
      }
    }
  }
`;
