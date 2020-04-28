import React from 'react'

import {relatedArticlesAdapter} from './articleAdapter'
import {ArticleMeta} from '../types'
import {Loader} from '../atoms/loader'
import {GridBlock} from '../blocks/gridBlock'
import {ArticleRoute} from './routeContext'
import {DefaultTeaser} from '../teasers/defaultTeaser'
import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {PageHeader} from '../atoms/pageHeader'
import {LoadMoreButton} from '../atoms/loadMoreButton'
import {useListArticlesQuery} from '../query'

export interface TagTemplateContainerProps {
  tag: string
}

export function TagTemplateContainer({tag}: TagTemplateContainerProps) {
  const first = 30
  const decodedTag = decodeURI(tag) as string
  const tagArray = [decodedTag]

  const {data, fetchMore, loading} = useListArticlesQuery({
    variables: {filter: tagArray, first: first, cursor: null}
  })

  if (loading) return <Loader text="Loading" />

  if (!data) return <NotFoundTemplate />

  const articles = relatedArticlesAdapter(data.articles.nodes).filter(
    article => article != null
  ) as ArticleMeta[]

  function loadMore() {
    if (data?.articles.pageInfo.endCursor == null) return

    fetchMore({
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult?.articles.nodes]
          }
        }
      },
      variables: {cursor: data.articles.pageInfo.endCursor, first: first, filter: tagArray}
    })
  }

  const hasNextPage = data.articles.pageInfo.hasNextPage

  return (
    <>
      <PageHeader title={decodedTag} />
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
