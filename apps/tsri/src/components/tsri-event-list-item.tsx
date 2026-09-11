import styled from '@emotion/styled';
import { EventList } from '@wepublish/event/website';
import { ImageWrapper } from '@wepublish/image/website';
import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import { MdLocationOn, MdTag } from 'react-icons/md';

import { EVENT_LOCATION_FALLBACK, TsriEventTag } from './tsri-event';

export const TsriEventListView = (props: BuilderEventListProps) => (
  <EventList
    {...props}
    descriptionMaxLength={500}
  />
);

export const EventListItemContainer = styled('div')`
  display: grid;
  width: 100%;
  position: relative;
  container-type: inline-size;
`;

export const EventListItemName = styled('h2')`
  justify-self: start;
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 700;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 1.125rem;
  }

  & a {
    color: inherit;
    text-decoration: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }
  }
`;

export const EventListItemContent = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(2, 2, 1)};
`;

export const EventListItemDate = styled('span')`
  align-self: flex-start;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(0.5, 1.5)};
  font-size: 0.75rem;
  line-height: 1.2;
  font-weight: 700;
  pointer-events: none;
  transition:
    background-color 0.3s,
    color 0.3s;
`;

export const EventListItemLead = styled('div')`
  & p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 0.875rem;
    }
  }

  & a {
    position: relative;
    z-index: 2;
  }
`;

export const EventListItemWrapper = styled('article')`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content auto auto;
  gap: 0;
  background-color: ${({ theme }) => theme.palette.primary.dark};
  padding: ${({ theme }) => theme.spacing(1, 1, 4.5)};
  border-radius: 0.75rem;
  overflow: hidden;

  ${EventListItemDate} {
    grid-row: 3;
    grid-column: 1;
    justify-self: start;
    align-self: start;
    z-index: 1;
    padding-left: ${({ theme }) => theme.spacing(2)};
  }

  ${EventListItemContent} {
    grid-row: 3;
    grid-column: 1;
    padding-top: ${({ theme }) => theme.spacing(5)};
  }

  @container (min-width: 520px) {
    grid-template-columns: min(68%, 468px) auto;
    grid-template-rows: 1fr auto auto 1fr;
    column-gap: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(2, 0, 2, 2)};

    ${EventListItemDate} {
      grid-row: 2;
      grid-column: 2;
      padding-left: ${({ theme }) => theme.spacing(1.5)};
    }

    ${EventListItemContent} {
      grid-row: 3;
      grid-column: 2;
      padding-top: ${({ theme }) => theme.spacing(2)};
    }
  }

  &:hover {
    ${EventListItemDate} {
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.common.black};
    }
  }
`;

export const EventListItemMeta = styled('div')`
  display: grid;
  grid-template-columns: 20px auto auto;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: flex-start;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 0.75rem;
  }

  & svg {
    font-size: 1rem;
  }
`;

const EventListItemImage = styled('div')`
  position: relative;
  align-self: start;
  grid-row: 1 / 3;
  grid-column: 1;
  aspect-ratio: 16/9;
  border-radius: 0.375rem 0.375rem 0 0;
  overflow: hidden;
  background-color: #d9ccbc;

  @container (min-width: 520px) {
    grid-row: 1 / -1;
    border-radius: 0.375rem;
  }

  & svg {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  ${ImageWrapper} {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PLACEHOLDER_GREEN = '#5c7e5c';

const sparkle = 'M -6 0 L 6 0 M 0 -6 L 0 6 M -4 -4 L 4 4 M 4 -4 L -4 4';

const EventPlaceholderIllustration = () => (
  <svg
    viewBox="0 0 480 270"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-hidden
  >
    <rect
      width="480"
      height="270"
      fill="#d9ccbc"
    />
    <g
      fill={PLACEHOLDER_GREEN}
      fontWeight="700"
    >
      <text
        transform="translate(48 84) rotate(-8)"
        fontSize="44"
      >
        Event
      </text>
      <text
        transform="translate(300 62) rotate(5)"
        fontSize="24"
        fill="none"
        stroke={PLACEHOLDER_GREEN}
        strokeWidth="1.25"
      >
        Event
      </text>
      <text
        transform="translate(140 178) rotate(3)"
        fontSize="60"
        fill="none"
        stroke={PLACEHOLDER_GREEN}
        strokeWidth="1.5"
      >
        Event
      </text>
      <text
        transform="translate(356 150) rotate(-7)"
        fontSize="20"
      >
        Event
      </text>
      <text
        transform="translate(48 236) rotate(6)"
        fontSize="26"
        fill="none"
        stroke={PLACEHOLDER_GREEN}
        strokeWidth="1.25"
      >
        Event
      </text>
      <text
        transform="translate(264 242) rotate(-4)"
        fontSize="34"
      >
        Event
      </text>
      <text
        transform="translate(408 240) rotate(9)"
        fontSize="16"
      >
        Event
      </text>
    </g>
    <g
      fill="none"
      stroke={PLACEHOLDER_GREEN}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path
        d={sparkle}
        transform="translate(36 36) scale(0.8)"
      />
      <path
        d={sparkle}
        transform="translate(438 96) scale(0.6) rotate(20)"
      />
      <path
        d={sparkle}
        transform="translate(226 118) scale(0.5) rotate(-12)"
      />
      <path
        d={sparkle}
        transform="translate(452 26) scale(0.9)"
      />
    </g>
  </svg>
);

const EventLocationWrapper = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: -1 / 1;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: start;
  width: 100%;

  & svg {
    margin-top: 2px;
  }
`;

const EventLocation = styled('div')`
  grid-column: 2 / 4;
`;

const EventTags = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  grid-column: 2 / 4;
`;

export const TsriEventListItem = ({
  url,
  description,
  name,
  lead,
  image,
  startsAt,
  endsAt,
  className,
  location,
  tags = [],
}: BuilderEventListItemProps) => {
  const {
    elements: { Link, Image, Paragraph },
    blocks: { RichText },
    date,
  } = useWebsiteBuilder();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <EventListItemContainer className={className}>
      <EventListItemWrapper>
        <EventListItemImage>
          <EventPlaceholderIllustration />
          {image && !imageFailed && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              image={image}
              onError={() => setImageFailed(true)}
            />
          )}
        </EventListItemImage>

        <EventListItemDate>
          <time
            suppressHydrationWarning
            dateTime={startsAt}
          >
            {date.format(new Date(startsAt), false)}
          </time>

          {endsAt &&
            new Date(endsAt).toDateString() !==
              new Date(startsAt).toDateString() && (
              <span>
                {' '}
                &ndash;{' '}
                <time
                  suppressHydrationWarning
                  dateTime={endsAt}
                >
                  {date.format(new Date(endsAt), false)}
                </time>
              </span>
            )}
        </EventListItemDate>

        <EventListItemContent>
          <EventListItemMeta>
            <EventLocationWrapper>
              <MdLocationOn />
              <EventLocation>
                {location ?? EVENT_LOCATION_FALLBACK}
              </EventLocation>
            </EventLocationWrapper>

            {!!tags?.length && (
              <EventLocationWrapper>
                <MdTag />
                <EventTags>
                  {tags.map(tag => (
                    <TsriEventTag key={tag.id}>{tag.tag}</TsriEventTag>
                  ))}
                </EventTags>
              </EventLocationWrapper>
            )}
          </EventListItemMeta>

          <EventListItemName>
            <Link href={url}>{name}</Link>
          </EventListItemName>

          <EventListItemLead>
            {lead ?
              <Paragraph>{lead}</Paragraph>
            : <RichText richText={description} />}
          </EventListItemLead>
        </EventListItemContent>
      </EventListItemWrapper>
    </EventListItemContainer>
  );
};
