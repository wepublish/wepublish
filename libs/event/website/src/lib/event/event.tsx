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
  grid-template-columns: auto auto auto;
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
    blocks: { RichText, Title, Image },
    date,
  } = useWebsiteBuilder();

  return (
    <EventWrapper className={className}>
      {data?.event && <EventSEO event={data.event} />}
      {data?.event.image && (
        <Image
          css={eventImage}
          image={data.event.image}
        />
      )}

      {data?.event && (
        <EventMeta>
          <MetaWrapper>
            <EventStart>
              <MdDateRange />
              {date.format(new Date(data.event.startsAt))}
            </EventStart>

            {data.event.endsAt && (
              <>
                <span>&ndash;</span> {date.format(new Date(data.event.endsAt))}
              </>
            )}
          </MetaWrapper>

          <MetaWrapper>
            <MdLocationCity />{' '}
            {data.event.location ?? 'Veranstaltungsort noch nicht bekannt'}
          </MetaWrapper>
        </EventMeta>
      )}

      <Title title={data?.event.name} />

      <RichText richText={data?.event.description ?? []} />
    </EventWrapper>
  );
};
