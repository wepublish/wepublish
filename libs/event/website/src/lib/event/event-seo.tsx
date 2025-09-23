import { firstParagraphToPlaintext } from '@wepublish/richtext';
import { Event, FullImageFragment } from '@wepublish/website/api';
import {
  BuilderEventSEOProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { formatISO, formatISODuration, intervalToDuration } from 'date-fns';
import { useMemo } from 'react';

export const getEventSEO = (event: Event) => {
  const description =
    event.lead ?? firstParagraphToPlaintext(event.description);
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
    url: event.url,
    image,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'Event',
      startDate,
      endDate,
      duration,
      keywords: event.tags?.map(tag => tag.tag).join(','),
      eventStatus: event.status,
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
            encodingFormat: image.mimeType,
          }
        : undefined,
      name: event.name,
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
