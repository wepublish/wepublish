import styled from '@emotion/styled'
import {ArticleContainer, ArticleListContainer, ArticleWrapper} from '@wepublish/article/website'
import {
  isTeaserGridBlock,
  isTeaserGridFlexBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock
} from '@wepublish/block-content/website'
import {CommentListContainer} from '@wepublish/comments/website'
import {ShowPaywallContext, useShowPaywall} from '@wepublish/paywall/website'
import {getArticlePathsBasedOnPage} from '@wepublish/utils/website'
import {
  addClientCacheToV1Props,
  ArticleDocument,
  ArticleListDocument,
  CommentItemType,
  CommentListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  Tag,
  useArticleQuery
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {anyPass} from 'ramda'
import {ComponentProps, useEffect} from 'react'

import {HauptstadtArticle} from '../../src/components/hauptstadt-article'

export const ArticleWrapperComments = styled(ArticleWrapper)``
export const ArticleWrapperAppendix = styled(ArticleWrapper)``

export default function ArticleBySlugOrId() {
  const router = useRouter()
  const {
    query: {slug, id, articleId}
  } = useRouter()
  const {
    elements: {H4}
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

  const lastBlock = data?.article.latest.blocks.at(-1)
  const isLastBlockTeaser =
    lastBlock &&
    anyPass([isTeaserGridBlock, isTeaserSlotsBlock, isTeaserGridFlexBlock, isTeaserListBlock])(
      lastBlock
    )

  const {showPaywall} = useShowPaywall(data?.article.paywall)

  useEffect(() => {
    if (!showPaywall && data?.article.paywall?.active) {
      router.replace({
        query: {
          articleId: data.article.id
        }
      })
    }
  }, [data?.article.id, data?.article.paywall?.active, router, showPaywall])

  return (
    <>
      <ShowPaywallContext.Provider
        value={{hideContent: articleId === data?.article.id ? false : undefined}}>
        <HauptstadtArticle {...containerProps} />
      </ShowPaywallContext.Provider>

      {data?.article && !isLastBlockTeaser && (
        <ArticleWrapperAppendix>
          <H4 component={'h2'}>Das könnte dich auch interessieren</H4>

          <ArticleListContainer
            variables={{filter: {tags: data.article.tags.map(tag => tag.id)}, take: 4}}
            filter={articles =>
              articles.filter(article => article.id !== data.article?.id).splice(0, 3)
            }
          />
        </ArticleWrapperAppendix>
      )}

      {data?.article && !data.article.disableComments && (
        <ArticleWrapperComments>
          <H4 component={'h2'} id="comments">
            Diskussion
          </H4>

          <CommentListContainer id={data!.article!.id} type={CommentItemType.Article} />
        </ArticleWrapperComments>
      )}
    </>
  )
}

export const getStaticPaths = getArticlePathsBasedOnPage('')

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
