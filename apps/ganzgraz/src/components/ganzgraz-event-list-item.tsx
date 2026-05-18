import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BuilderEventListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { CiCalendar, CiHashtag, CiLocationOn } from 'react-icons/ci';

export const eventListItemStyles = css`
  display: grid;
  width: 100%;
  color: inherit;
  text-decoration: inherit;
  container-type: inline-size;
`;

export const EventListItemContent = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(1)};

  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s;
`;

export const EventListItemWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr;
  align-content: start;

  @container (min-width: 400px) {
    grid-template-columns: minmax(30%, 200px) auto;
  }

  &:hover {
    ${EventListItemContent} {
      border-color: ${({ theme }) => theme.palette.primary.light};
    }
  }
`;

export const EventListItemMeta = styled('div')`
  display: grid;
  grid-template-columns: 25px auto auto;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: flex-start;
  align-items: center;
`;

const EventListItemDate = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: -1 / 1;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const EventListItemImage = styled('div')``;

const EventTagWrapper = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: -1 / 1;
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
  padding: ${({ theme }) => theme.spacing(0.5)}
    ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  font-size: 0.75rem;
`;

const EventTagIcon = styled(CiHashtag)`
  grid-column: 1 / 2;
  align-self: start;
  margin-top: 6px;
`;

const EventLocationWrapper = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: -1 / 1;
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

export const GanzGrazEventListItem = ({
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
    elements: { H4, Link, Image, Paragraph },
    blocks: { RichText },
    date,
  } = useWebsiteBuilder();

  return (
    <Link
      href={url}
      css={eventListItemStyles}
    >
      <EventListItemWrapper className={className}>
        <EventListItemImage>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {image && <Image image={image} />}
        </EventListItemImage>

        <EventListItemContent>
          <EventListItemMeta>
            <EventListItemDate>
              <CiCalendar />
              <time
                suppressHydrationWarning
                dateTime={startsAt}
              >
                {date.format(new Date(startsAt), false)}
              </time>
            </EventListItemDate>

            {endsAt &&
              new Date(endsAt).toDateString() !==
                new Date(startsAt).toDateString() && (
                <>
                  &ndash;{' '}
                  <time
                    suppressHydrationWarning
                    dateTime={endsAt}
                  >
                    {date.format(new Date(endsAt), false)}
                  </time>
                </>
              )}

            {tags && tags.length > 0 && (
              <EventTagWrapper>
                <EventTagIcon />
                <EventTags>
                  {tags.map(tag => (
                    <EventTag key={tag.id}>{tag.tag}</EventTag>
                  ))}
                </EventTags>
              </EventTagWrapper>
            )}

            <EventLocationWrapper>
              <EventLocationIcon />

              <EventLocation>
                {location ?? 'Veranstaltungsort noch nicht bekannt'}
              </EventLocation>
            </EventLocationWrapper>
          </EventListItemMeta>

          <H4 component="h1">{name}</H4>
          {lead ?
            <Paragraph>{lead}</Paragraph>
          : <RichText richText={description ?? []} />}
        </EventListItemContent>
      </EventListItemWrapper>
    </Link>
  );
};
