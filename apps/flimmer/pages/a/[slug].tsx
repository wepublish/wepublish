import styled from '@emotion/styled'
import {ArticleContainer, ArticleListContainer, ArticleWrapper} from '@wepublish/article/website'
import {ArticleAuthor} from '@wepublish/author/website'
import {CommentListContainer} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {H2} from '@wepublish/ui'
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
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

const AfterArticleTitle = styled(H2)`
  ${({theme}) => theme.breakpoints.down('sm')} {
    font-size: 2rem;
  }
`

export const AuthorWrapper = styled(ContentWrapper)`
  margin: 0 ${({theme}) => theme.spacing(6)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0;
  }
`

export default function ArticleBySlugIdOrToken() {
  const {
    query: {slug, id, token}
  } = useRouter()

  const {data} = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string
    }
  })

  const containerProps = {
    slug,
    id,
    token
  } as ComponentProps<typeof ArticleContainer>

  return (
    <>
      <ArticleContainer {...containerProps}>
        {data?.article?.latest.authors.map(author => (
          <AuthorWrapper key={author.id} fullWidth>
            <ArticleAuthor author={author} />
          </AuthorWrapper>
        ))}
      </ArticleContainer>

      {data?.article && (
        <>
          <ArticleWrapper>
            <AfterArticleTitle component={'h2'}>
              Das könnte dich auch interessieren
            </AfterArticleTitle>

            <ArticleListContainer
              variables={{filter: {tags: data.article.tags.map(tag => tag.id)}, take: 4}}
              filter={articles => articles.filter(article => article.id !== data.article?.id)}
            />
          </ArticleWrapper>

          {!data.article.disableComments && (
            <ArticleWrapper>
              <AfterArticleTitle component={'h2'} id="comments">
                Kommentare
              </AfterArticleTitle>

              <CommentListContainer
                id={data.article.id}
                type={CommentItemType.Article}
                signUpUrl="/mitmachen"
              />
            </ArticleWrapper>
          )}
        </>
      )}
    </>
  )
}

export const getStaticPaths = getArticlePathsBasedOnPage('')

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug, id, token} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
        slug,
        id,
        token
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
    revalidate: 60 // every 60 seconds
  }
}
