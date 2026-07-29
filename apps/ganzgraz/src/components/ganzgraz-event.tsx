import styled from '@emotion/styled';
import { css, Theme } from '@mui/material';
import {
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
} from '@wepublish/block-content/website';
import { ContentWrapper } from '@wepublish/content/website';
import { EventSEO } from '@wepublish/event/website';
import { ImageWrapper } from '@wepublish/image/website';
import {
  BuilderEventProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { CiCalendar, CiHashtag, CiLocationOn } from 'react-icons/ci';

export const EventWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

const eventImage = (theme: Theme) => css`
  ${ImageBlockInnerWrapper} {
    width: 100%;
    height: 100%;
  }

  ${ImageWrapper} {
    object-fit: cover;
    width: 100%;
    height: 100%;
    min-height: 100%;
    min-width: 100%;
  }

  figcaption {
    display: none;
  }

  ${theme.breakpoints.up('md')} {
    grid-column: 4/10 !important;
  }
`;

const titleStyle = (theme: Theme) => css`
  margin: 0 0 ${theme.spacing(1.5)} 0;
`;

const EventStartDate = styled('div')`
  grid-column: 1 / 2;
`;

const EventStartTime = styled('div')`
  grid-column: 1 / 2;
`;

const EventEndDate = styled('div')`
  grid-column: 2 / 3;
`;

const EventEndTime = styled('div')`
  grid-column: 3 / 4;
`;

const EventDateRange = styled('div')`
  display: grid;
  grid-column: 2 / 4;
  grid-template-columns: subgrid;
  align-items: center;
  position: relative;

  &[data-show-dash='true']:after {
    content: '—';
    display: block;
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-200%, -50%);
  }
`;

const EventTimeSameDay = styled('div')`
  display: grid;
  grid-column: 2 / 3;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  position: relative;

  ${EventEndTime} {
    grid-column: 2 / 3;
  }

  &[data-show-dash='true']:after {
    content: '—';
    display: block;
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-140%, -50%);
  }
`;

const EventHeader = styled('header')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.grey[200]};
  padding: ${({ theme }) => theme.spacing(2)};

  ${ImageBlockWrapper} + & {
    margin-top: -${({ theme }) => theme.spacing(2)};
  }
`;

const EventBody = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const EventDateWrapper = styled('div')`
  display: grid;
  grid-template-columns: 30px repeat(2, 1fr);
  column-gap: ${({ theme }) => theme.spacing(1)};
  row-gap: ${({ theme }) => theme.spacing(0.5)};
  align-items: center;
  width: 100%;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 360px;
  }
`;

const EventLocationWrapper = styled('div')`
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  width: 100%;
`;

const EventLocation = styled('div')`
  grid-column: 2 / 3;
`;

const EventLocationIcon = styled(CiLocationOn)`
  grid-column: 1 / 2;
  align-self: start;
  margin-top: 6px;
`;

const EventTagWrapper = styled('div')`
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

const EventTags = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  grid-column: 2 / 3;
`;

const EventTag = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.light};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  padding: ${({ theme }) => theme.spacing(0.5, 2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  font-size: 0.75rem;
`;

const EventTagIcon = styled(CiHashtag)`
  grid-column: 1 / 2;
  align-self: start;
  margin-top: 6px;
`;

export const GanzGrazEvent = ({
  data,
  loading,
  error,
  className,
}: BuilderEventProps) => {
  const {
    blocks: { RichText, Title, Image },
    date,
  } = useWebsiteBuilder();

  if (!data?.event) {
    return null;
  }

  const event = data.event;
  const startDate = new Date(event.startsAt);
  const endDate = event.endsAt ? new Date(event.endsAt) : null;
  const isSameDay =
    !!endDate && startDate.toDateString() === endDate.toDateString();
  const showInlineEndTime = !!endDate && isSameDay;
  const showSiblingEndTime = !!endDate && !isSameDay;

  const endTime = endDate && (
    <EventEndTime>
      {endDate.toLocaleTimeString('de-AT', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </EventEndTime>
  );

  return (
    <EventWrapper className={className}>
      {<EventSEO event={event} />}

      {event.image && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          css={eventImage}
          image={event.image}
        />
      )}
      <EventHeader>
        <Title
          css={titleStyle}
          title={event.name}
        />

        {event.tags && event.tags.length > 0 && (
          <EventTagWrapper>
            <EventTagIcon />
            <EventTags>
              {event.tags.map(tag => (
                <EventTag key={tag.id}>{tag.tag}</EventTag>
              ))}
            </EventTags>
          </EventTagWrapper>
        )}

        <EventDateWrapper>
          <CiCalendar />

          <EventDateRange data-show-dash={showSiblingEndTime}>
            <EventStartDate>{date.format(startDate, false)}</EventStartDate>

            <EventEndDate>
              {endDate && !isSameDay && date.format(endDate, false)}
            </EventEndDate>
          </EventDateRange>

          <EventTimeSameDay data-show-dash={showInlineEndTime}>
            <EventStartTime>
              {startDate.toLocaleTimeString('de-AT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </EventStartTime>

            {showInlineEndTime && endTime}
          </EventTimeSameDay>

          {showSiblingEndTime && endTime}
        </EventDateWrapper>

        <EventLocationWrapper>
          <EventLocationIcon />

          <EventLocation>
            {data.event.location ?? 'Veranstaltungsort noch nicht bekannt'}
          </EventLocation>
        </EventLocationWrapper>
      </EventHeader>

      <EventBody>
        <RichText richText={data?.event.description} />
      </EventBody>
    </EventWrapper>
  );
};
