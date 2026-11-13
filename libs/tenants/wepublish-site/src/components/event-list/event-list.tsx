import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  selectTeaserImage,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  Image,
  Link,
} from '@wepublish/website/builder';
import { useId } from 'react';

import { designText } from '../../theme';
import { BlockHeader, splitButtonTeaser } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { formatEventDate } from './format-event-date';

export const isEventList = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.EventList)({ blockStyle });

export const EventListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

export const EventListEvents = styled('div')`
  display: grid;
  // Never wider than the screen, even while an image is missing
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: 30px;
  }
`;

export const EventListEvent = styled('article')`
  a,
  a:hover {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${({ theme }) => theme.spacing(2)};
    color: inherit;
    text-decoration: none;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: minmax(0, 401px) minmax(0, 1fr);
      align-items: start;
      gap: 30px;
    }
  }
`;

export const EventListImage = styled(Image)`
  width: 100%;
  aspect-ratio: 401 / 219;
  object-fit: cover;
`;

export const EventListText = styled('div')`
  display: grid;
  gap: 5px;
`;

export const EventListTitle = styled('h3')`
  ${designText.h3 as CSSObject}
  margin: 0 0 15px;
  hyphens: manual;
`;

export const EventListDetail = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.dark};
`;

const EventListTeaser = ({ teaser }: { teaser: FullTeaserFragment }) => {
  const titleId = useId();
  const event = teaser.__typename === 'EventTeaser' ? teaser.event : null;
  const image = selectTeaserImage(teaser);

  return (
    <EventListEvent aria-labelledby={titleId}>
      <Link
        href={selectTeaserUrl(teaser) ?? undefined}
        target={selectTeaserTarget(teaser) ?? undefined}
      >
        {image && <EventListImage image={image} />}

        <EventListText>
          <EventListTitle id={titleId}>
            {selectTeaserTitle(teaser)}
          </EventListTitle>

          {event?.startsAt && (
            <EventListDetail>
              {formatEventDate(event.startsAt, event.endsAt)}
            </EventListDetail>
          )}
          {event?.location && (
            <EventListDetail>{event.location}</EventListDetail>
          )}
        </EventListText>
      </Link>
    </EventListEvent>
  );
};

/**
 * The next events below each other, with image, name, date and place. A custom
 * teaser without image is the button next to the title (e.g. "Alle anzeigen").
 */
export const EventList = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => {
  const { entries: events, button } = splitButtonTeaser(teasers);

  return (
    <EventListWrapper className={className}>
      <BlockHeader
        title={title}
        button={button}
      />

      <EventListEvents>
        {events.map((teaser, index) => (
          <EventListTeaser
            key={index}
            teaser={teaser}
          />
        ))}
      </EventListEvents>
    </EventListWrapper>
  );
};
