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
  WebsiteBuilderProvider,
  Article
} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

import {BriefingNewsletter} from '../../src/components/briefing-newsletter/briefing-newsletter'
import {FdtPollBlock} from '../../src/components/frage-des-tages/fdt-poll-block'
import {Container} from '../../src/components/layout/container'
import {BajourAuthorChip} from '../../src/components/website-builder-overwrites/author/author-chip'
import {BajourComment} from '../../src/components/website-builder-overwrites/blocks/comment/comment'
import {CommentListContainer} from '../../src/components/website-builder-overwrites/blocks/comment-list-container/comment-list-container'
import {BajourTeaserSlider} from '../../src/components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider'
import {FdTArticle} from '../../src/components/frage-des-tages/fdt-article'

const uppercase = css`
  text-transform: uppercase;
`

const RelatedArticleSlider = (props: BuilderArticleListProps) => {
  return (
    <WebsiteBuilderProvider blocks={{TeaserGrid: BajourTeaserSlider}}>
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

export default function ArticleBySlugIdOrToken() {
  const {
    query: {slug, id, token}
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

  const containerProps = {
    slug,
    id,
    token
  } as ComponentProps<typeof ArticleContainer>

  const isFDT = data?.article?.tags.some(({tag}) => tag === 'frage-des-tages')

  return (
    <WebsiteBuilderProvider
      ArticleList={RelatedArticleSlider}
      blocks={{
        Poll: isFDT ? FdtPollBlock : PollBlock
      }}
      Article={isFDT ? FdTArticle : Article}
      Comment={isFDT ? BajourComment : Comment}>
      <Container>
        <ArticleContainer {...containerProps} />

        <BriefingNewsletter />

        {data?.article && (
          <>
            <ArticleWrapper>
              <H5 component={'h2'} css={uppercase}>
                Das könnte dich auch interessieren
              </H5>

              <ArticleListContainer
                variables={{filter: {tags: {ids: data.article.tags.map(tag => tag.id)}}, take: 4}}
                filter={articles => articles.filter(article => article.id !== data.article?.id)}
              />
            </ArticleWrapper>

            {!isFDT &&
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
                  maxCommentDepth={1}
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
