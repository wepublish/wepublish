import styled from '@emotion/styled';
import { BaseTeaser, TeaserTime } from '@wepublish/block-content/website';
import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from '@wepublish/utils/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';

export const isPageTeaser = ({ teaser }: BuilderTeaserProps) =>
  teaser?.__typename === 'PageTeaser';

const BaseTeaserWithoutDate = styled(BaseTeaser)`
  ${TeaserTime} {
    display: none;
  }
`;

export const GanzGrazBaseTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [
    isTeaserLogoWall,
    (props: BuilderTeaserProps) => <TeaserLogoWall {...props} />,
  ],
  [
    isPageTeaser,
    (props: BuilderTeaserProps) => <BaseTeaserWithoutDate {...props} />,
  ],
  [T, (props: BuilderTeaserProps) => <BaseTeaser {...props} />],
]);
