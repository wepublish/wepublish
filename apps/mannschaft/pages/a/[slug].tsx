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
import {useHasActiveSubscription} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

import {PaywallBlock} from '../../src/paywall/paywall-block'

const paywallCss = css`
  // Shows the first 3 blocks (usually title, image, richtext) and hides the rest
  & > :nth-child(n + 4):not(:is(${ArticleInfoWrapper})) {
    display: none;
  }

  // fade out the third block (usually richtext) to indicate the user that a paywall is hitting.
  & > :nth-child(3) {
    -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 100%);
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 100%);
  }
`

export default function ArticleBySlugIdOrToken() {
  const hasSubscription = useHasActiveSubscription()
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
      slug: slug as string,
      id: id as string,
      token: token as string
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
  const {slug, id, token} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [article] = await Promise.all([
    client.query({
      query: ApiV1.ArticleDocument,
      variables: {
        slug,
        id,
        token
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
          itemId: article.data.article.id
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
