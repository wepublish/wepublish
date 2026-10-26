import { firstParagraphToPlaintext } from '@wepublish/richtext';
import { stripQueryAndHash } from '@wepublish/utils';
import {
  EventScheduleType,
  EventStatus,
  FullEventFragment,
  FullImageFragment,
} from '@wepublish/website/api';
import {
  BuilderEventSEOProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { formatISO, formatISODuration, intervalToDuration } from 'date-fns';
import { useMemo } from 'react';

const schemaEventStatus: Record<EventStatus, string> = {
  [EventStatus.Confirmed]: 'https://schema.org/EventScheduled',
  [EventStatus.Cancelled]: 'https://schema.org/EventCancelled',
  [EventStatus.Postponed]: 'https://schema.org/EventPostponed',
  [EventStatus.SoldOut]: 'https://schema.org/EventScheduled',
};

export const getEventSEO = (event: FullEventFragment) => {
  const description = firstParagraphToPlaintext(
    event.description?.content ?? []
  );
  const image = event.image as FullImageFragment | undefined;
  const startDate =
    event.startsAt ? formatISO(new Date(event.startsAt)) : undefined;
  const endDate = event.endsAt ? formatISO(new Date(event.endsAt)) : undefined;
  const duration =
    (
      event.scheduleType === EventScheduleType.Continuous &&
      event.startsAt &&
      event.endsAt
    ) ?
      formatISODuration(
        intervalToDuration({
          start: new Date(event.startsAt),
          end: new Date(event.endsAt),
        })
      )
    : undefined;
  const offers =
    event.status === EventStatus.SoldOut ?
      { '@type': 'Offer', availability: 'https://schema.org/SoldOut' }
    : undefined;

  return {
    type: 'website',
    title: event.name ?? undefined,
    description,
    url: event.url ? stripQueryAndHash(event.url) : undefined,
    image,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'Event',
      startDate,
      endDate,
      duration,
      keywords: event.tags?.map(tag => tag.tag).join(','),
      eventStatus: schemaEventStatus[event.status],
      offers,
      location: event.location,
      image:
        image ?
          {
            height: image.height,
            width: image.width,
            representativeOfPage: true,
            contentUrl: image.url,
            thumbnailUrl: image.m,
            url: image.url,
            encodingFormat: 'image/webp',
          }
        : undefined,
      name: event.name ?? undefined,
      description,
    },
  };
};

export const EventSEO = ({ event }: BuilderEventSEOProps) => {
  const { meta, Head } = useWebsiteBuilder();
  const seo = useMemo(() => getEventSEO(event), [event]);

  const title = `${seo.title ? `${seo.title} —` : ``} ${meta.siteTitle}`;

  return (
    <Head>
      <title key="title">{title}</title>

      <meta
        key={'og:type'}
        property="og:type"
        content={seo.type}
      />
      <meta
        key={'og:title'}
        property="og:title"
        content={seo.title}
      />

      {seo.description && (
        <>
          <meta
            key={'og:description'}
            property="og:description"
            content={seo.description}
          />
          <meta
            key={'description'}
            name="description"
            content={seo.description}
          />
        </>
      )}

      <meta
        key={'og:url'}
        property="og:url"
        content={seo.url}
      />
      <link
        key={'canonical'}
        rel="canonical"
        href={seo.url}
      />

      {seo.image && (
        <>
          <meta
            key={'og:image:xl'}
            property="og:image"
            content={seo.image.xl ?? ''}
          />
          <meta
            key={'og:image:width:xl'}
            property="og:image:width"
            content="1200"
          />

          <meta
            key={'og:image:m'}
            property="og:image"
            content={seo.image.m ?? ''}
          />
          <meta
            key={'og:image:width:m'}
            property="og:image:width"
            content="800"
          />

          <meta
            key={'og:image:s'}
            property="og:image"
            content={seo.image.s ?? ''}
          />
          <meta
            key={'og:image:width:s'}
            property="og:image:width"
            content="500"
          />

          <meta
            key={'og:image:xs'}
            property="og:image"
            content={seo.image.xs ?? ''}
          />
          <meta
            key={'og:image:width:xs'}
            property="og:image:width"
            content="300"
          />

          <meta
            key={'og:image:xxs'}
            property="og:image"
            content={seo.image.xxs ?? ''}
          />
          <meta
            key={'og:image:width:xxs'}
            property="og:image:width"
            content="200"
          />

          <meta
            key={'og:image:l'}
            property="og:image"
            content={seo.image.l ?? ''}
          />
          <meta
            key={'og:image:width:l'}
            property="og:image:width"
            content="1000"
          />
        </>
      )}

      <meta
        key={'twitter:card'}
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        key={'max-image-preview'}
        name="robots"
        content="max-image-preview:large"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schema) }}
      />
    </Head>
  );
};
