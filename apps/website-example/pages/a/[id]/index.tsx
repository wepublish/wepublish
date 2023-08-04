import {
  ApiV1,
  ArticleContainer,
  ArticleWrapper,
  CommentListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function ArticleById() {
  const {
    query: {id}
  } = useRouter()
  const {
    elements: {H5}
  } = useWebsiteBuilder()

  return (
    <>
      <ArticleContainer id={id as string} />

      <ArticleWrapper>
        <H5 component={'h2'}>Kommentare</H5>
        <CommentListContainer id={id as string} type={ApiV1.CommentItemType.Article} />
      </ArticleWrapper>
    </>
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

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: ApiV1.ArticleDocument,
      variables: {
        id
      }
    }),
    client.query({
      query: ApiV1.CommentListDocument,
      variables: {
        itemId: id
      }
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
