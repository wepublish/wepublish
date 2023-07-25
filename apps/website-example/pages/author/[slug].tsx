import {ApiV1, AuthorContainer} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export function AuthorBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return <>{slug && <AuthorContainer slug={slug as string} />}</>
}

export default AuthorBySlug

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await client.query({
    query: ApiV1.AuthorDocument,
    variables: {
      slug
    }
  })

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
