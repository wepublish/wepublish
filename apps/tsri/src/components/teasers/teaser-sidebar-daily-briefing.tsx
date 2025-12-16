import styled from '@emotion/styled';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useContext } from 'react';

import { DailyBriefingContext } from './teaser-sidebar-daily-briefing-context';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserWrapper as TeaserWrapperDefault } from './tsri-teaser';
/*
export const isDailyBriefingTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'daily-briefing',
]);
*/

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

const DailyBriefingLinkList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-rows: min-content;
  font-size: 1.3cqw !important;
  line-height: 1.49cqw !important;
  font-weight: 700 !important;
`;

const DailyBriefingLink = styled('li')`
  color: black;
  margin: 0 0 0.2cqw 0;

  & a {
    color: inherit;
    text-decoration: none;
    padding: 0.5cqw;
    display: block;
    background-color: white;

    &:hover {
      background-color: #f5ff64;
      color: black;
    }
  }
`;

export const DailyBriefingTeaser = ({
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
        <DailyBriefingLinkList>
          {campaigns.map(campaign => (
            <DailyBriefingLink key={campaign.id}>
              <Link
                href={campaign.long_archive_url}
                color="inherit"
                underline="none"
                target="_blank"
              >
                {campaign.settings.subject_line}
              </Link>
            </DailyBriefingLink>
          ))}
        </DailyBriefingLinkList>
      </DailyBriefingTeaserWrapper>
    </TeaserWrapper>
  );
};
