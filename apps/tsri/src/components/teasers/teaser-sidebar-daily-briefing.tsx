import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { createWithTheme } from '@wepublish/ui';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useContext } from 'react';

import { sidebarDailyBriefingTheme } from '../../theme';
import { DailyBriefingContext } from './teaser-sidebar-daily-briefing-context';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserWrapper as TeaserWrapperDefault } from './tsri-teaser';

export const isDailyBriefingTeaser = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.DailyBriefing;
  },
]);

export const TeaserWrapper = styled(TeaserWrapperDefault)`
  aspect-ratio: unset;
  container: unset;
`;

const DailyBriefingTeaserWrapper = styled('div')`
  display: grid;
  grid-auto-rows: min-content;
`;

export const DailyBriefingTeaserBase = ({
  alignment,
  teaser,
}: BuilderTeaserProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const campaigns = useContext(DailyBriefingContext);

  return (
    <TeaserWrapper {...alignment}>
      <DailyBriefingTeaserWrapper>
        <Typography variant="dailyBriefingLinkList">
          {campaigns.map(campaign => (
            <Typography
              variant="dailyBriefingLinkItem"
              key={campaign.id}
            >
              <Link
                href={campaign.long_archive_url}
                variant="dailyBriefingLink"
                target="_blank"
              >
                {campaign.settings.subject_line}
              </Link>
            </Typography>
          ))}
        </Typography>
      </DailyBriefingTeaserWrapper>
    </TeaserWrapper>
  );
};

export const StyledTeaserSidebarDailyBriefing = styled(
  DailyBriefingTeaserBase
)``;

export const DailyBriefingTeaser = createWithTheme(
  StyledTeaserSidebarDailyBriefing,
  sidebarDailyBriefingTheme
);
