import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {Event, FullImageFragment} from '@wepublish/website/api'
import {BuilderEventSEOProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {formatISO, formatISODuration, intervalToDuration} from 'date-fns'
import {useMemo} from 'react'

export const getEventSEO = (event: Event) => {
  const description = firstParagraphToPlaintext(event.description)
  const image = (event.image as FullImageFragment)?.largeURL ?? event.image?.url
  const startDate = formatISO(new Date(event.startsAt))
  const endDate = event.endsAt ? formatISO(new Date(event.endsAt)) : undefined
  const duration = event.endsAt
    ? formatISODuration(
        intervalToDuration({
          start: new Date(event.startsAt),
          end: new Date(event.endsAt)
        })
      )
    : undefined

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
      image,
      name: event.name,
      description
    }
  }
}

export const EventSEO = ({event}: BuilderEventSEOProps) => {
  const {Head, Script} = useWebsiteBuilder()
  const seo = useMemo(() => getEventSEO(event), [event])

  return (
    <>
      <Head>
        <meta key={'og:type'} property="og:type" content={seo.type} />
        <meta key={'og:title'} property="og:title" content={seo.title} />

        {seo.description && (
          <>
            <meta key={'og:description'} property="og:description" content={seo.description} />
            <meta key={'description'} name="description" content={seo.description} />
          </>
        )}

        <meta key={'og:url'} property="og:url" content={seo.url} />
        <link key={'canonical'} rel="canonical" href={seo.url} />

        {seo.image && <meta key={'og:image'} property="og:image" content={seo.image} />}

        <meta key={'twitter:card'} name="twitter:card" content="summary_large_image" />
      </Head>

      <Script type="application/ld+json">{JSON.stringify(seo.schema)}</Script>
    </>
  )
}
