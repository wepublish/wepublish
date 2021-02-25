import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'

import {Loader} from '../atoms/loader'

import {relatedArticlesAdapter} from './articleAdapter'
import {ArticleMeta} from '../types'
import {GridBlock} from '../blocks/gridBlock'
import {DefaultTeaser} from '../teasers/defaultTeaser'
import {ArticleRoute, Link} from './routeContext'
import {PageHeader} from '../atoms/pageHeader'
import {RoundImage} from '../atoms/roundImage'
import {LoadMoreButton} from '../atoms/loadMoreButton'
import {useListArticlesQuery, useAuthorQuery} from '../query'
import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RoundIconButton} from '../atoms/roundIconButton'
import {IconType} from '../atoms/icon'
import {pxToRem} from '../style/helpers'

export const AuthorImageStyle = cssRule({
  display: 'flex',
  justifyContent: 'center',
  margin: '40px'
})

const AuthorSocialStyle = cssRule({
  display: 'flex',
  marginBottom: '1em',
  justifyContent: 'center',
  fontSize: pxToRem(40),

  '& > a > div': {
    margin: '0 auto'
  },

  '& > a': {
    minWidth: pxToRem(60),
    margin: `0 ${pxToRem(9)}`,
    textAlign: 'center'
  }
})

const SocialTitleStyle = cssRule({
  fontSize: pxToRem(12),
  paddingTop: pxToRem(6)
})

export interface AuthorProps {
  id?: string
}

export function AuthorTemplateContainer({id}: AuthorProps) {
  const css = useStyle()
  const first = 30

  const {data, loading: isLoadingAuthor} = useAuthorQuery({variables: {id: id, slug: id}})
  const author = data?.authorBySlug ?? data?.authorByID
  const authorID = author?.id ?? ''

  const {data: articlesData, fetchMore, loading: isLoadingArticles} = useListArticlesQuery({
    variables: {authors: [authorID], first: first, cursor: null},
    skip: author == null
  })

  if (isLoadingAuthor || isLoadingArticles) return <Loader text="Loading" />
  if (!articlesData || !data || !author) return <NotFoundTemplate />

  const {name, image, links, bio} = author

  const articles = relatedArticlesAdapter(articlesData.articles.nodes).filter(
    article => article != null
  ) as ArticleMeta[]

  function loadMore() {
    if (articlesData?.articles.pageInfo.endCursor == null) return

    fetchMore({
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult.articles.nodes]
          }
        }
      },
      variables: {
        first: first,
        cursor: articlesData.articles.pageInfo.endCursor,
        authors: [authorID]
      }
    })
  }

  const hasNextPage = articlesData.articles.pageInfo.hasNextPage

  function linkUrlToIcon(linkUrl: string) {
    if (linkUrl.includes('facebook')) return IconType.Facebook
    if (linkUrl.includes('twitter')) return IconType.Twitter
    if (linkUrl.includes('instagram')) return IconType.Instagram
    if (linkUrl.includes('@')) return IconType.Mail
    if (linkUrl.includes('tel')) return IconType.Phone

    return IconType.Website
  }

  return (
    <>
      <PageHeader title={name} />

      {image && (
        // <TitleImageBlock imageRef={image} width={600} height={400} />
        <div className={css(AuthorImageStyle)}>
          <RoundImage width={300} height={300} src={image.largeURL} />
        </div>
      )}

      {links && links.length > 0 && (
        <div className={css(AuthorSocialStyle)}>
          {links.map(link => (
            <Link key={link.title} target="_blank" rel="noopener" href={link.url}>
              <RoundIconButton icon={linkUrlToIcon(link.url)}></RoundIconButton>
              <div className={css(SocialTitleStyle)}>
                <span>{link.title}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* {bio && <RichText value={bio} />} */}
      {bio && (
        <RichTextBlock
          value={bio}
          onChange={() => {
            /* do nothing */
          }}
        />
      )}

      <GridBlock numColumns={articles.length <= 1 ? 1 : 3}>
        {articles.map(article => (
          <DefaultTeaser
            key={article.id}
            preTitle={article.preTitle}
            title={article.title}
            date={article.publishedAt}
            image={article.image}
            peer={article.peer}
            tags={article.tags}
            route={ArticleRoute.create({id: article.id, slug: article.slug})}
            authors={article.authors}
            isSingle={true}
          />
        ))}
      </GridBlock>
      {hasNextPage ? <LoadMoreButton onLoadMore={loadMore} /> : ''}
    </>
  )
}
