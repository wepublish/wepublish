import {css} from '@mui/material'
import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {
  ApiV1,
  ArticleContainer,
  ArticleInfoWrapper,
  ArticleListContainer,
  ArticleWrapper,
  CommentListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

import {useHasSubscription} from '../../src/paywall/has-subscription'
import {PaywallBlock} from '../../src/paywall/paywall-block'

const paywallCss = css`
  // Shows the first 3 blocks (usually title, image, richtext) and hides the rest
  & > :nth-child(n + 4):not(:is(${ArticleInfoWrapper})) {
    display: none;
  }
`

export default function ArticleBySlugIdOrToken() {
  const hasSubscription = useHasSubscription()
  const {
    query: {slug: slugs, id, token, articleId}
  } = useRouter()
  const slug = typeof slugs === 'object' ? slugs.reverse()[0] : slugs
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  const containerProps = {
    slug,
    id,
    token
  } as ComponentProps<typeof ArticleContainer>

  const showPaywall =
    !hasSubscription &&
    articleId !== data?.article?.id &&
    data?.article?.tags.some(({tag}) => tag === 'MANNSCHAFT+')

  return (
    <>
      <ArticleContainer {...containerProps} css={showPaywall ? paywallCss : undefined}>
        {showPaywall && <PaywallBlock />}
      </ArticleContainer>

      {data?.article && (
        <>
          <ArticleWrapper>
            <H3 component={'h2'}>Das könnte dich auch interessieren</H3>

            <ArticleListContainer
              variables={{filter: {tags: data.article.tags.map(tag => tag.id)}, take: 4}}
              filter={articles => articles.filter(article => article.id !== data.article?.id)}
            />
          </ArticleWrapper>

          {!data.article.disableComments && (
            <ArticleWrapper>
              <H3 component={'h2'}>Kommentare</H3>
              <CommentListContainer id={data.article.id} type={ApiV1.CommentItemType.Article} />
            </ArticleWrapper>
          )}
        </>
      )}
    </>
  )
}

export const getStaticPaths = getPagePathsBasedOnPage('')

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
            tags: article.data.article.tags.map((tag: ApiV1.Tag) => tag.id)
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
