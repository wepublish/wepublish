import {css} from '@mui/material'
import {
  ArticleContainer,
  ArticleInfoWrapper,
  ArticleListContainer,
  ArticleWrapper
} from '@wepublish/article/website'
import {CommentListContainer} from '@wepublish/comments/website'
import {useHasActiveSubscription} from '@wepublish/membership/website'
import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {CommentItemType, Tag} from '@wepublish/website/api'
import {
  addClientCacheToV1Props,
  ArticleDocument,
  ArticleListDocument,
  CommentListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
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
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 100%);
  }
`

export default function ArticleBySlugOrId() {
  const hasSubscription = useHasActiveSubscription()
  const {
    query: {slug: slugs, id, articleId}
  } = useRouter()
  const slug = typeof slugs === 'object' ? slugs.reverse()[0] : slugs
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  const {data} = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string
    }
  })

  const containerProps = {
    slug,
    id
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
              filter={articles =>
                articles.filter(article => article.id !== data.article?.id).splice(0, 3)
              }
            />
          </ArticleWrapper>

          {!data.article.disableComments && (
            <ArticleWrapper>
              <H3 component={'h2'}>Kommentare</H3>
              <CommentListContainer id={data.article.id} type={CommentItemType.Article} />
            </ArticleWrapper>
          )}
        </>
      )}
    </>
  )
}

export const getStaticPaths = getPagePathsBasedOnPage('')

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {id, slug} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
        id,
        slug
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  if (article.data?.article) {
    await Promise.all([
      client.query({
        query: ArticleListDocument,
        variables: {
          filter: {
            tags: article.data.article.tags.map((tag: Tag) => tag.id)
          },
          take: 4
        }
      }),
      client.query({
        query: CommentListDocument,
        variables: {
          itemId: article.data.article.id
        }
      })
    ])
  }

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: !article.data?.article ? 1 : 60 // every 60 seconds
  }
}
