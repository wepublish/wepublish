import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { FullEventFragment } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import {
  ArticleOverviewPagination,
  pageBottomSpace,
} from '../article-list/article-overview';
import { BlockHeaderTitle } from '../block-header';
import { EventListEvents, EventRow } from '../event-list/event-list';
import { formatEventDate } from '../event-list/format-event-date';

export const pastEventsPerPage = 10;

export const EventOverviewWrapper = styled('div')`
  ${({ theme }) => pageBottomSpace(theme)}
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(8)};

  // As much room below the navbar as a page that opens with a title block
  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 120px;
    padding-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 100px;
  }
`;

export const EventOverviewSection = styled('section')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

// 180px above the past events in the design, more than between the other parts
export const PastEventsSection = styled(EventOverviewSection)`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-top: 60px;
  }
`;

export const NoEvents = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;
`;

// The past events as a plain list, separated by grey lines
export const PastEventList = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`;

export const PastEvent = styled('article')`
  & + & {
    border-top: 1px solid #888888;
    margin-top: 25px;
    padding-top: 25px;

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin-top: 35px;
      padding-top: 35px;
    }
  }

  a,
  a:hover {
    display: grid;
    gap: 15px;
    color: inherit;
    text-decoration: none;
  }
`;

export const PastEventTitle = styled('h3')`
  ${designText.h4 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const PastEventDetails = styled('p')`
  ${designText.text as CSSObject}
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.dark};
`;

const endOf = ({ startsAt, endsAt }: FullEventFragment) =>
  new Date(endsAt ?? startsAt);

const byStart = (a: FullEventFragment, b: FullEventFragment) =>
  new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();

const PastEventEntry = ({ event }: { event: FullEventFragment }) => {
  const titleId = useId();
  const { locale } = useRouter();

  return (
    <PastEvent aria-labelledby={titleId}>
      <Link href={event.url}>
        <PastEventTitle id={titleId}>{event.name}</PastEventTitle>

        <PastEventDetails>
          <span>{formatEventDate(event.startsAt, event.endsAt, locale)}</span>
          {event.location && <span>{event.location}</span>}
        </PastEventDetails>
      </Link>
    </PastEvent>
  );
};

/**
 * All events: the title of the page, the coming events with their image (the
 * next one on top, a running one included) and the past ones as a plain list
 * (the latest on top), ten per page.
 */
export const WepEventOverview = ({
  events,
  now = new Date(),
  page = 1,
  onPageChange,
}: {
  events: FullEventFragment[];
  now?: Date;
  page?: number;
  onPageChange: (page: number) => void;
}) => {
  const { t } = useTranslation();
  const {
    blocks: { Title },
    elements: { Pagination },
  } = useWebsiteBuilder();
  const upcomingId = useId();
  const pastId = useId();

  const upcoming = events.filter(event => endOf(event) >= now).sort(byStart);
  const past = events
    .filter(event => endOf(event) < now)
    .sort((a, b) => byStart(b, a));

  const pageCount = Math.max(1, Math.ceil(past.length / pastEventsPerPage));
  const pastOnPage = past.slice(
    (page - 1) * pastEventsPerPage,
    page * pastEventsPerPage
  );

  return (
    <EventOverviewWrapper>
      <Title
        __typename="TitleBlock"
        blockStyle={null}
        preTitle={t('eventOverview.preTitle')}
        title={t('eventOverview.title')}
        lead={t('eventOverview.lead')}
      />

      <EventOverviewSection aria-labelledby={upcomingId}>
        {/* Named for screen readers, the title of the page already says it */}
        <h2
          id={upcomingId}
          hidden
        >
          {t('eventOverview.upcoming')}
        </h2>

        {upcoming.length ?
          <EventListEvents>
            {upcoming.map(event => (
              <EventRow
                key={event.id}
                href={event.url}
                image={event.image}
                title={event.name}
                startsAt={event.startsAt}
                endsAt={event.endsAt}
                location={event.location}
              />
            ))}
          </EventListEvents>
        : <NoEvents>{t('eventOverview.noUpcoming')}</NoEvents>}
      </EventOverviewSection>

      {past.length > 0 && (
        <PastEventsSection aria-labelledby={pastId}>
          <BlockHeaderTitle id={pastId}>
            {t('eventOverview.past')}
          </BlockHeaderTitle>

          <PastEventList>
            {pastOnPage.map(event => (
              <PastEventEntry
                key={event.id}
                event={event}
              />
            ))}
          </PastEventList>

          {pageCount > 1 && (
            <ArticleOverviewPagination>
              <Pagination
                page={page}
                count={pageCount}
                onChange={(_, value) => onPageChange(value)}
              />
            </ArticleOverviewPagination>
          )}
        </PastEventsSection>
      )}
    </EventOverviewWrapper>
  );
};
