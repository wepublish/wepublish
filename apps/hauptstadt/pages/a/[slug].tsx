import styled from '@emotion/styled'
import {ArticleContainer, ArticleListContainer, ArticleWrapper} from '@wepublish/article/website'
import {CommentListContainer} from '@wepublish/comments/website'
import {ShowPaywallContext} from '@wepublish/paywall/website'
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
import {ComponentProps} from 'react'

import {HauptstadtArticle} from '../../src/components/hauptstadt-article'

export const ArticleWrapperComments = styled(ArticleWrapper)``
export const ArticleWrapperAppendix = styled(ArticleWrapper)``

export default function ArticleBySlugOrId() {
  const {
    query: {slug, id, articleId}
  } = useRouter()
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

  return (
    <>
      <ShowPaywallContext.Provider
        value={{hideContent: articleId === data?.article.id ? false : undefined}}>
        <HauptstadtArticle {...containerProps} />
      </ShowPaywallContext.Provider>

      {data?.article && (
        <ArticleWrapperAppendix>
          <H3 component={'h2'}>Das könnte dich auch interessieren</H3>

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
          <H3 component={'h2'} id="comments">
            Kommentare
          </H3>

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
