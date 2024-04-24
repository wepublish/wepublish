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

export default function ArticleBySlug() {
  const {
    query: {slug}
  } = useRouter()
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  return (
    <>
      <ArticleContainer slug={slug as string} />

      {data?.article && (
        <>
          <ArticleWrapper>
            <H3 component={'h2'}>Das könnte dich auch interessieren</H3>
            <ArticleListContainer
              variables={{filter: {tags: data.article.tags}, take: 4}}
              filter={articles => articles.filter(article => article.id !== data.article?.id)}
            />
          </ArticleWrapper>

          <ArticleWrapper>
            <H3 component={'h2'}>Kommentare</H3>
            <CommentListContainer id={data.article.id} type={ApiV1.CommentItemType.Article} />
          </ArticleWrapper>
        </>
      )}
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await client.query({
    query: ApiV1.PageDocument,
    variables: {
      slug: ''
    }
  })

  const cache = Object.values(client.cache.extract())
  const articleSlugs = []

  for (const storeObj of cache) {
    if (storeObj?.__typename === 'Article' && !(storeObj as ApiV1.Article).peeredArticleURL) {
      articleSlugs.push((storeObj as ApiV1.Article).slug)
    }

    if (articleSlugs.length > 20) {
      break
    }
  }

  return {
    paths: articleSlugs.map(slug => ({
      params: {
        slug
      }
    })),
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [article] = await Promise.all([
    client.query({
      query: ApiV1.ArticleDocument,
      variables: {
        slug
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  if (article.data.article) {
    await Promise.all([
      client.query({
        query: ApiV1.ArticleListDocument,
        variables: {
          filter: {
            tags: article.data.article.tags
          },
          take: 4
        }
      }),
      client.query({
        query: ApiV1.CommentListDocument,
        variables: {
          filter: {
            itemId: article.data.article.id
          }
        }
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
