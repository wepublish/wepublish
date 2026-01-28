import styled from '@emotion/styled';
import {
  BaseTeaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';
import { cond, T } from 'ramda';

import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from './daily-briefing/daily-briefing-teaser';

const OverridenTeaser = styled(BaseTeaser)`
  &,
  &:hover {
    ${TeaserPreTitleNoContent},
    ${TeaserPreTitleWrapper} {
      background-color: unset;
    }
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }

  ${TeaserImageWrapper}:empty {
    min-height: unset;
  }
`;

export const CulturTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <OverridenTeaser {...props} />],
]);
