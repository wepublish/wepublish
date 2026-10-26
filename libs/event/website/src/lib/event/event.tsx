import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderEventProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdDateRange, MdLocationCity } from 'react-icons/md';
import { EventSEO } from './event-seo';
import { ContentWrapper } from '@wepublish/content/website';
import { ImageWrapper } from '@wepublish/image/website';
import { EventStatusBadge } from '../event-status/event-status';

export const EventWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(4)};
`;

const eventImage = css`
  ${ImageWrapper} {
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
`;

export const EventMeta = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: -${({ theme }) => theme.spacing(4)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2/12;
  }
`;

const MetaWrapper = styled('div')`
  display: grid;
  grid-auto-flow: column;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-start;
  align-items: center;
`;

const EventStart = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

export const Event = ({
  data,
  loading,
  error,
  className,
}: BuilderEventProps) => {
  const {
    blocks: { RichText, Title, Image, Blocks },
    date,
  } = useWebsiteBuilder();

  const event = data?.event;

  return (
    <EventWrapper className={className}>
      {event && <EventSEO event={event} />}
      {event?.image && (
        <Image
          css={eventImage}
          image={event.image}
          caption={null}
          linkUrl={null}
        />
      )}

      {event && (
        <EventMeta>
          <MetaWrapper>
            {event.startsAt && (
              <EventStart>
                <MdDateRange />
                <time
                  suppressHydrationWarning
                  dateTime={event.startsAt}
                >
                  {date.format(new Date(event.startsAt))}
                </time>
              </EventStart>
            )}

            {event.startsAt && event.endsAt && (
              <>
                <span>&ndash;</span>{' '}
                <time
                  suppressHydrationWarning
                  dateTime={event.endsAt}
                >
                  {date.format(new Date(event.endsAt))}
                </time>
              </>
            )}

            <EventStatusBadge status={event.status} />
          </MetaWrapper>

          <MetaWrapper>
            <MdLocationCity />{' '}
            {event.location ?? 'Veranstaltungsort noch nicht bekannt'}
          </MetaWrapper>
        </EventMeta>
      )}

      <Title title={event?.name ?? null} />

      {event?.latest ?
        <Blocks
          key={event.latest.id}
          blocks={event.latest.blocks}
          type="Page"
        />
      : <RichText richText={event?.description ?? null} />}
    </EventWrapper>
  );
};
