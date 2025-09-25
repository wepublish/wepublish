import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderEventListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdDateRange } from 'react-icons/md';

export const eventListItemStyles = css`
  display: grid;
  width: 100%;
  color: inherit;
  text-decoration: inherit;
  container-type: inline-size;
`;

export const EventListItemWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr;
  align-content: start;

  @container (min-width: 400px) {
    grid-template-columns: minmax(30%, 200px) auto;
  }
`;

export const EventListItemContent = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const EventListItemMeta = styled('div')`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-content: flex-start;
  align-items: center;
`;

const EventListItemDate = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const EventListItemImage = styled('div')``;

export const EventListItem = ({
  url,
  description,
  name,
  lead,
  image,
  startsAt,
  endsAt,
  className,
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
          {image && <Image image={image} />}
        </EventListItemImage>

        <EventListItemContent>
          <EventListItemMeta>
            <EventListItemDate>
              <MdDateRange />
              <time
                suppressHydrationWarning
                dateTime={startsAt}
              >
                {date.format(new Date(startsAt))}
              </time>
            </EventListItemDate>

            {endsAt && (
              <>
                &ndash;{' '}
                <time
                  suppressHydrationWarning
                  dateTime={endsAt}
                >
                  {date.format(new Date(endsAt))}
                </time>
              </>
            )}
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
