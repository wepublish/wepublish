import styled from '@emotion/styled';
import { css } from '@mui/material';
import { EventSEO, EventWrapper } from '@wepublish/event/website';
import { ImageWrapper } from '@wepublish/image/website';
import {
  BuilderEventProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdCalendarToday, MdLocationOn, MdTag } from 'react-icons/md';

import {
  TSRI_TWO_COLUMN_CONTENT_CLASS,
  twoColumnContentStyles,
} from './tsri-two-column-content';

export const EVENT_LOCATION_FALLBACK = 'Veranstaltungsort noch nicht bekannt';

export const TsriEventWrapper = styled(EventWrapper)`
  &.${TSRI_TWO_COLUMN_CONTENT_CLASS} {
    ${({ theme }) => twoColumnContentStyles(theme)}
  }
`;

const eventImage = css`
  ${ImageWrapper} {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    border-radius: 1rem;
  }
`;

export const TsriEventMeta = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: start;
  font-size: 0.875rem;
  font-weight: 700;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 0.75rem;
  }
`;

const TsriEventMetaRow = styled('div')`
  display: grid;
  grid-template-columns: 20px auto;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;

  & svg {
    font-size: 1rem;
  }
`;

export const TsriEventTags = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
`;

export const TsriEventTag = styled('span')`
  background-color: ${({ theme }) => theme.palette.common.white};
  color: ${({ theme }) => theme.palette.common.black};
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  padding: ${({ theme }) => theme.spacing(0.25, 1.25)};
  border-radius: 999px;
  font-size: 0.75rem;
  line-height: 1.5;
  font-weight: 700;
`;

export const TsriEvent = ({ data, className }: BuilderEventProps) => {
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
  const endsOnOtherDay =
    !!endDate && startDate.toDateString() !== endDate.toDateString();

  return (
    <TsriEventWrapper
      className={[className, TSRI_TWO_COLUMN_CONTENT_CLASS]
        .filter(Boolean)
        .join(' ')}
    >
      <EventSEO event={event} />

      <Title
        title={event.name}
        lead={event.lead ?? undefined}
      />

      <TsriEventMeta>
        <TsriEventMetaRow>
          <MdCalendarToday />
          <div>
            <time
              suppressHydrationWarning
              dateTime={event.startsAt}
            >
              {date.format(startDate)}
            </time>
            {endDate && (
              <>
                {' '}
                &ndash;{' '}
                <time
                  suppressHydrationWarning
                  dateTime={event.endsAt ?? undefined}
                >
                  {endsOnOtherDay ?
                    date.format(endDate)
                  : endDate.toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }
                </time>
              </>
            )}
          </div>
        </TsriEventMetaRow>

        <TsriEventMetaRow>
          <MdLocationOn />
          <div>{event.location ?? EVENT_LOCATION_FALLBACK}</div>
        </TsriEventMetaRow>

        {!!event.tags?.length && (
          <TsriEventMetaRow>
            <MdTag />
            <TsriEventTags>
              {event.tags.map(tag => (
                <TsriEventTag key={tag.id}>{tag.tag}</TsriEventTag>
              ))}
            </TsriEventTags>
          </TsriEventMetaRow>
        )}
      </TsriEventMeta>

      {event.image && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          css={eventImage}
          image={event.image}
        />
      )}

      <RichText richText={event.description} />
    </TsriEventWrapper>
  );
};
