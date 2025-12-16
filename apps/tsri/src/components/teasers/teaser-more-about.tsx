import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserTopicMeta } from './teaser-topic-meta';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserLead,
  TeaserPreTitle,
  TeaserTitle,
} from './tsri-teaser';

export const isTeaserMoreAbout = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.MoreAbout;
  },
]);

export const TeaserMoreAbout = styled(TeaserTopicMeta)`
  ${TeaserContentWrapper} {
    grid-template-rows: unset;
    padding-top: 7cqw;
  }

  & ${TeaserTitle} {
    display: none;
  }

  & ${TeaserLead} {
    display: none;
  }

  & ${TeaserPreTitle} {
    font-size: 1.1cqw !important;
    font-weight: 700 !important;
    line-height: 1.2cqw !important;
  }
`;
