import styled from '@emotion/styled';
import { campaigns } from '@mailchimp/mailchimp_marketing';
import { TeaserWrapper } from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { createContext, useContext } from 'react';

export const isDailyBriefingTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'daily-briefing',
]);

export const DailyBriefingContext = createContext<campaigns.Campaigns[]>([]);

const DailyBriefingTeaserWrapper = styled('div')`
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({ theme }) => theme.spacing(4)};
  background-color: ${({ theme }) => theme.palette.accent.main};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const DailyBriefingTitle = styled('h1')``;

const DailyBriefingLinkList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const DailyBriefingLink = styled('li')`
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  border-bottom: currentColor 1px solid;
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  font-weight: 600;

  &:last-child {
    border-bottom: 0;
  }
`;

export const DailyBriefingTeaser = ({
  alignment,
  teaser,
}: BuilderTeaserProps) => {
  const {
    elements: { H4, Link },
  } = useWebsiteBuilder();
  const campaigns = useContext(DailyBriefingContext);

  return (
    <TeaserWrapper {...alignment}>
      <DailyBriefingTeaserWrapper>
        <H4 component={DailyBriefingTitle}>
          {teaser?.title || 'Daily Briefing'}
        </H4>

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
