import React from 'react'
import {ArticleFooter} from '../navigation/articleFooter'
import {useListArticlesQuery} from '../query'
import {ArticleMeta, Author, Comment, Peer} from '../types'
import {relatedArticlesAdapter} from './articleAdapter'

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
  const take = 4

  const {data, loading} = useListArticlesQuery({
    variables: {filter: tags.length >= 1 ? tags : undefined, take}
  })

  const {data: fallbackData, loading: fallbackLoading} = useListArticlesQuery({
    variables: {take}
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
        isPeerArticle={isPeerArticle}
        peer={peer}
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
      peer={peer}
      comments={comments}
      itemID={id}
    />
  )
}
