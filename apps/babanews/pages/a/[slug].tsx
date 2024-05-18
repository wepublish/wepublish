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

export const ArticleTagList = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(75px, max-content));
  gap: ${({theme}) => theme.spacing(1)};
`

export default function ArticleBySlug() {
  const {
    push,
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
      <ArticleContainer slug={slug as string}>
        <ArticleTagList>
          {data?.article?.tags.map((tag, index) => (
            <Chip
              key={index}
              label={capitalize(tag.tag ?? '')}
              variant="outlined"
              onClick={() => push(`/a/tag/${tag}`)}
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

          <ArticleWrapper>
            <H3 component={'h2'}>Kommentare</H3>
            <CommentListContainer id={data.article.id} type={ApiV1.CommentItemType.Article} />
          </ArticleWrapper>
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
