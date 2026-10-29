import type { Event, WithContext } from 'schema-dts';
import { firstParagraphToPlaintext } from '@wepublish/richtext';
import { stripQueryAndHash } from '@wepublish/utils';
import {
  EventStatus,
  FullEventFragment,
  FullImageFragment,
} from '@wepublish/website/api';
import {
  BuilderEventSEOProps,
  useWebsiteBuilder,
  seoImageObject,
} from '@wepublish/website/builder';
import { formatISO, formatISODuration, intervalToDuration } from 'date-fns';
import { useMemo } from 'react';

const EVENT_STATUS = {
  [EventStatus.Cancelled]: 'https://schema.org/EventCancelled',
  [EventStatus.Postponed]: 'https://schema.org/EventPostponed',
  [EventStatus.Rescheduled]: 'https://schema.org/EventRescheduled',
  [EventStatus.Scheduled]: 'https://schema.org/EventScheduled',
} as const;

export const getEventSEO = (event: FullEventFragment) => {
  const description =
    event.lead ?? firstParagraphToPlaintext(event.description?.content ?? []);
  const image = event.image as FullImageFragment | undefined;
  const startDate = formatISO(new Date(event.startsAt));
  const endDate = event.endsAt ? formatISO(new Date(event.endsAt)) : undefined;
  const duration =
    event.endsAt ?
      formatISODuration(
        intervalToDuration({
          start: new Date(event.startsAt),
          end: new Date(event.endsAt),
        })
      )
    : undefined;

  return {
    type: 'website',
    title: event.name,
    description,
    url: stripQueryAndHash(event.url),
    image,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      startDate,
      endDate,
      duration,
      keywords: event.tags?.map(tag => tag.tag).join(','),
      eventStatus: EVENT_STATUS[event.status],
      location: event.location ?? undefined,
      image: seoImageObject(image),
      name: event.name,
      description,
    } satisfies WithContext<Event>,
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
