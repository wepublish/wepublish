import styled from '@emotion/styled';
import {
  BaseTeaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';
import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from '@wepublish/utils/website';
import { cond, T } from 'ramda';

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
