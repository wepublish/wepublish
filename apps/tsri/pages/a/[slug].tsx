import {styled} from '@mui/material'
import {H2} from '@wepublish/ui'
import {getArticlePathsBasedOnPage} from '@wepublish/utils/website'
import {
  ApiV1,
  ArticleAuthor,
  ArticleContainer,
  ArticleListContainer,
  ArticleWrapper,
  CommentListContainer
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

import TsriAdHeader from '../../src/components/tsri-ad-header'

const AfterArticleTitle = styled(H2)`
  ${({theme}) => theme.breakpoints.down('sm')} {
    font-size: 2rem;
  }
`

export default function ArticleBySlugIdOrToken() {
  const {
    query: {slug, id, token}
  } = useRouter()

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

  return (
    <>
      <TsriAdHeader authors={data?.article?.authors} />

      <ArticleContainer {...containerProps}>
        {data?.article?.authors.map(author => (
          <ArticleAuthor key={author.id} author={author} />
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
                type={ApiV1.CommentItemType.Article}
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

  if (article.data?.article) {
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
