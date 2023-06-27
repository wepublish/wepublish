import {ApiV1, EventContainer, EventSEO} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

type EventByIdProps = {
  event?: ApiV1.Event
}

export default function EventById({event}: EventByIdProps) {
  const {
    query: {id}
  } = useRouter()

  return (
    <>
      {event && <EventSEO event={event} />}
      <EventContainer id={id as string} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {id} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const data = await client.query({
    query: ApiV1.EventDocument,
    variables: {
      id
    }
  })

  return {
    props: {
      event: data?.data?.event
    },
    revalidate: 60 // every 60 seconds
  }
}
