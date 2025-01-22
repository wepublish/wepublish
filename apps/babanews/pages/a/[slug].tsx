import {capitalize, Chip, styled} from '@mui/material'
import {getArticlePathsBasedOnPage} from '@wepublish/utils/website'
import {
  ApiV1,
  ArticleContainer,
  ArticleListContainer,
  ArticleWrapper,
  CommentListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

export const ArticleTagList = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(75px, max-content));
  gap: ${({theme}) => theme.spacing(1)};
`

export default function ArticleBySlugIdOrToken() {
  const {
    push,
    query: {slug, id, token}
  } = useRouter()
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

  return (
    <>
      <ArticleContainer {...containerProps}>
        <ArticleTagList>
          {data?.article?.tags.map((tag, index) => (
            <Chip
              key={index}
              label={capitalize(tag.tag ?? '')}
              variant="outlined"
              onClick={() => push(tag.url)}
            />
          ))}
        </ArticleTagList>
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
