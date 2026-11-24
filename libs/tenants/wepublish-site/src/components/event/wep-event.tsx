import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { EventSEO } from '@wepublish/event/website';
import {
  BuilderEventProps,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import { pageBottomSpace } from '../article-list/article-overview';
import { tertiaryButton } from '../button-styles';
import { formatEventDate } from '../event-list/format-event-date';
import { downloadCalendarFile, googleCalendarUrl } from './calendar';

export const WepEventWrapper = styled('article')`
  ${({ theme }) => pageBottomSpace(theme)}
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(6)};

  // As much room below the navbar as a page that opens with a title block
  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 120px;
    padding-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 100px;
  }
`;

export const EventHeader = styled('header')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`;

// Below the name, as wide as the title (1140 of the 1270px in the design)
export const EventIntro = styled('div')`
  display: grid;
  gap: 30px;
  margin-top: 40px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: calc(100% * 1140 / 1270);
  }
`;

export const EventFacts = styled('p')`
  ${designText.paragraph as CSSObject}
  display: flex;
  flex-wrap: wrap;
  gap: 0 30px;
  margin: 0;
`;

export const EventLead = styled('p')`
  ${designText.paragraph as CSSObject}
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.dark};
  hyphens: manual;
`;

export const EventCalendarLinks = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 20px 30px;
  margin-top: 10px;
`;

export const EventCalendarButton = styled('button')`
  ${({ theme }) => tertiaryButton(theme)}
  white-space: normal;
`;

export const EventCalendarLink = styled(Link)`
  ${({ theme }) => tertiaryButton(theme)}
  white-space: normal;
`;

// Over the whole width in the format of the design, cut to fit
export const EventImage = styled(Image)`
  width: 100%;
  max-height: none;
  aspect-ratio: 1273 / 849;
  object-fit: cover;
`;

// The description in the reading column of the texts (750 of 1273px)
export const EventDescription = styled('div')`
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: calc(100% * 750 / 1273);
    justify-self: center;
  }

  p {
    hyphens: manual;
  }
`;

/**
 * The page of an event: "Event" above its name, date, place and lead, links
 * to save it in a calendar, below the image and the description.
 */
export const WepEvent = ({ className, data }: BuilderEventProps) => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const {
    blocks: { Title, RichText },
  } = useWebsiteBuilder();

  // The address of the site, known in the browser only
  const [origin, setOrigin] = useState<string>();
  useEffect(() => setOrigin(window.location.origin), []);

  const event = data?.event;

  if (!event) {
    return null;
  }

  return (
    <WepEventWrapper className={className}>
      <EventSEO event={event} />

      <EventHeader>
        <Title
          __typename="TitleBlock"
          blockStyle={null}
          preTitle={t('eventPage.preTitle')}
          title={event.name}
          lead={null}
        />

        <EventIntro>
          <EventFacts>
            <time
              dateTime={event.startsAt}
              suppressHydrationWarning
            >
              {formatEventDate(event.startsAt, event.endsAt, locale)}
            </time>
            {event.location && <span>{event.location}</span>}
          </EventFacts>

          {event.lead && <EventLead>{event.lead}</EventLead>}

          <EventCalendarLinks>
            <EventCalendarButton
              type="button"
              onClick={() => downloadCalendarFile(event)}
            >
              {t('eventPage.saveCalendarFile')}
            </EventCalendarButton>

            <EventCalendarLink
              href={googleCalendarUrl(event, origin)}
              target="_blank"
            >
              {t('eventPage.addToGoogleCalendar')}
            </EventCalendarLink>
          </EventCalendarLinks>
        </EventIntro>
      </EventHeader>

      {event.image && (
        <EventImage
          image={event.image}
          fetchPriority="high"
        />
      )}

      {event.description && (
        <EventDescription>
          <RichText
            __typename="RichTextBlock"
            blockStyle={null}
            richText={event.description}
          />
        </EventDescription>
      )}
    </WepEventWrapper>
  );
};
