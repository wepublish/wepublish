import {
  ApiV1,
  ArticleContainer,
  ArticleListContainer,
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
    elements: {H3}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      id: id as string
    }
  })

  return (
    <>
      <ArticleContainer id={id as string} />

      {data?.article && (
        <ArticleWrapper>
          <H3 component={'h2'}>Das könnte dich auch interessieren</H3>
          <ArticleListContainer variables={{filter: {tags: data.article.tags}}} />
        </ArticleWrapper>
      )}

      <ArticleWrapper>
        <H3 component={'h2'}>Kommentare</H3>
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
  const [article] = await Promise.all([
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

  await client.query({
    query: ApiV1.ArticleListDocument,
    variables: {
      filter: {
        tags: article.data.article.tags
      }
    }
  })

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
