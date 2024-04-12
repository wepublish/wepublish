import {
  ApiV1,
  ArticleContainer,
  ArticleList,
  ArticleListContainer,
  ArticleWrapper,
  BuilderArticleListProps,
  CommentListContainer,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import {BriefingNewsletter} from '../../src/components/bajour/briefing-newsletter/briefing-newsletter'
import {Container} from '../../src/components/layout/container'
import {TeaserSlider} from '../../src/components/website-builder-overwrites/blocks/teaser-slider/teaser-slider'

export const RelatedArticleSlider = (props: BuilderArticleListProps) => {
  return (
    <WebsiteBuilderProvider blocks={{TeaserGrid: TeaserSlider}}>
      <ArticleList {...props} />
    </WebsiteBuilderProvider>
  )
}

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
    <WebsiteBuilderProvider ArticleList={RelatedArticleSlider}>
      <Container>
        <ArticleContainer slug={slug as string} />

        <BriefingNewsletter />

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
      </Container>
    </WebsiteBuilderProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await client.query({
    query: ApiV1.PageDocument,
    variables: {
      slug: 'home'
    }
  })

  const cache = Object.values(client.cache.extract())
  const articleSlugs = cache.reduce((slugs, storeObj) => {
    if (storeObj?.__typename === 'Article' && !(storeObj as ApiV1.Article).peeredArticleURL) {
      slugs.push((storeObj as ApiV1.Article).slug)
    }

    return slugs
  }, [] as string[])

  return {
    paths: articleSlugs.map(slug => ({
      params: {
        slug
      }
    })),
    fallback: true
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
      }),
      client.query({
        query: ApiV1.PeerProfileDocument
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
