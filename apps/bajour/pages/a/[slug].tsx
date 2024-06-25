import {css, styled} from '@mui/material'
import {getArticlePathsBasedOnPage} from '@wepublish/utils/website'
import {
  ApiV1,
  ArticleContainer,
  ArticleList,
  ArticleListContainer,
  ArticleWrapper,
  BuilderArticleListProps,
  Comment,
  ContentWrapper,
  PollBlock,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import {BriefingNewsletter} from '../../src/components/briefing-newsletter/briefing-newsletter'
import {FrageDesTagesArticle} from '../../src/components/frage-des-tages/frage-des-tages-article'
import {Container} from '../../src/components/layout/container'
import {BajourArticle} from '../../src/components/website-builder-overwrites/article/bajour-article'
import {BajourAuthorChip} from '../../src/components/website-builder-overwrites/author/author-chip'
import {CommentListContainer} from '../../src/components/website-builder-overwrites/blocks/comment-list-container/comment-list-container'
import {TeaserSlider} from '../../src/components/website-builder-overwrites/blocks/teaser-slider/teaser-slider'
import {BajourComment} from '../../src/components/website-builder-overwrites/blocks/comment/comment'

const uppercase = css`
  text-transform: uppercase;
`

const RelatedArticleSlider = (props: BuilderArticleListProps) => {
  return (
    <WebsiteBuilderProvider blocks={{TeaserGrid: TeaserSlider}}>
      <ArticleList {...props} />
    </WebsiteBuilderProvider>
  )
}

export const AuthorWrapper = styled(ContentWrapper)`
  margin: 0 ${({theme}) => theme.spacing(6)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0;
  }
`

export default function ArticleBySlug() {
  const {
    query: {slug}
  } = useRouter()
  const {
    elements: {H5}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  const isFDT = data?.article?.tags.some(({tag}) => tag === 'frage-des-tages')

  return (
    <WebsiteBuilderProvider
      ArticleList={RelatedArticleSlider}
      blocks={{
        Poll: isFDT ? FrageDesTagesArticle : PollBlock
      }}
      Article={BajourArticle}
      Comment={isFDT ? BajourComment : Comment}>
      <Container>
        <ArticleContainer slug={slug as string} />

        <BriefingNewsletter />

        {data?.article && (
          <>
            <ArticleWrapper>
              <H5 component={'h2'} css={uppercase}>
                Das könnte dich auch interessieren
              </H5>

              <ArticleListContainer
                variables={{filter: {tags: data.article.tags.map(tag => tag.id)}, take: 4}}
                filter={articles => articles.filter(article => article.id !== data.article?.id)}
              />
            </ArticleWrapper>

            {data?.article?.authors.length &&
              data?.article?.authors.map(a => (
                <AuthorWrapper key={a.id}>
                  <BajourAuthorChip key={a.id} author={a} />
                </AuthorWrapper>
              ))}

            {!isFDT && (
              <ArticleWrapper>
                <H5 component={'h2'} css={uppercase}>
                  Kommentare
                </H5>

                <CommentListContainer
                  id={data.article.id}
                  type={ApiV1.CommentItemType.Article}
                  variables={{sort: ApiV1.CommentSort.Rating, order: ApiV1.SortOrder.Descending}}
                />
              </ArticleWrapper>
            )}
          </>
        )}
      </Container>
    </WebsiteBuilderProvider>
  )
}

export const getStaticPaths = getArticlePathsBasedOnPage('home')

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
    }),
    client.query({
      query: ApiV1.SettingListDocument
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
          sort: ApiV1.CommentSort.Rating,
          order: ApiV1.SortOrder.Descending,
          itemId: article.data.article.id
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
