import {EventContainer} from '@wepublish/event/website'
import {
  addClientCacheToV1Props,
  EventDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument
} from '@wepublish/website/api'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import {Container} from '../../src/components/layout/container'

export default function EventById() {
  const {
    query: {id}
  } = useRouter()

  return (
    <Container>
      <EventContainer id={id as string} />
    </Container>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {id} = params || {}

  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await Promise.all([
    client.query({
      query: EventDocument,
      variables: {
        id
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
