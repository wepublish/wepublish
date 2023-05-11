import {ApiV1, useWebsiteBuilder} from '@wepublish/website'
import {useMemo} from 'react'

export const getEventSEO = (event: ApiV1.Event) => {}

type EventSEOProps = {
  event: ApiV1.Event
}

export const EventSEO = ({event}: EventSEOProps) => {
  const {Head} = useWebsiteBuilder()
  const seo = useMemo(() => getEventSEO(event), [event])

  return <Head></Head>
}
