import React from 'react'

import {ArticleFooter} from '../navigation/articleFooter'
import {relatedArticlesAdapter} from './articleAdapter'
import {Author, Peer, ArticleMeta, Comment} from '../types'
import {useListArticlesQuery} from '../query'

export interface ArticleFooterContainerProps {
  readonly tags: string[]
  readonly authors?: Author[]
  readonly peer?: Peer
  readonly publishDate: Date
  readonly id: string
  readonly comments?: Comment[]
  isPeerArticle?: boolean
}

export function ArticleFooterContainer({
  tags,
  authors,
  comments,
  peer,
  publishDate,
  id,
  isPeerArticle
}: ArticleFooterContainerProps) {
  const first = 4

  const {data, loading} = useListArticlesQuery({
    variables: {filter: tags.length >= 1 ? tags : undefined, first: first}
  })

  const {data: fallbackData, loading: fallbackLoading} = useListArticlesQuery({
    variables: {first: first}
  })

  const tagArticles = data?.articles.nodes
    .concat(fallbackData?.articles.nodes ?? [])
    .filter(article => article.id != id)

  if (loading || fallbackLoading) {
    return (
      <ArticleFooter
        relatedArticles={[]}
        tags={tags}
        authors={authors}
        itemID={id}
        comments={comments}
      />
    )
  }

  if (!tagArticles) return null

  let articles = relatedArticlesAdapter(tagArticles).filter(
    article => article != null
  ) as ArticleMeta[]

  articles = articles.slice(0, 3)

  return (
    <ArticleFooter
      relatedArticles={articles}
      tags={tags}
      authors={authors}
      isPeerArticle={isPeerArticle}
      comments={comments}
      itemID={id}
    />
  )
}
