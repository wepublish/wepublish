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
} from './teasers/teaser-sidebar-daily-briefing';

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

export const TsriTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <OverridenTeaser {...props} />],
]);
