import {ApiV1, PageContainer} from '@wepublish/website'
import {BajourEventList} from '../../../src/components/bajour-event-list'
import {useRouter} from 'next/router'

export function EventsByTag() {
  const {
    query: {id}
  } = useRouter()

  return (
    <>
      <PageContainer slug="" />

      <BajourEventList
        variables={{
          filter: {upcomingOnly: true, tags: [id as string]},
          take: 100,
          sort: ApiV1.EventSort.StartsAt
        }}
      />
    </>
  )
}

export default EventsByTag
