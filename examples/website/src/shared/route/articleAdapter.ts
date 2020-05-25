import {PublishedArticle, Author, ArticleMeta, Peer} from '../types'
import {imageAdapter, getArticleBlocks} from './blockAdapters'

export function peerAdapter(peer: any): Peer {
  return {
    id: peer.id,
    slug: peer.slug,
    name: peer.profile.name,
    logoURL: peer.profile.logo?.squareURL,
    websiteURL: peer.profile.websiteURL,
    themeColor: peer.profile.themeColor
  }
}

export function authorsAdapter(authors: any): Author[] {
  return authors.map((author: any) => {
    return {
      id: author.id,
      url: author.url,
      slug: author.slug,
      name: author.name,
      image: author.image && imageAdapter(author.image)
    }
  })
}

function articleMetaAdapter(article: any): ArticleMeta {
  const {publishedAt, updatedAt} = article

  return {
    id: article.id,
    url: article.url,
    publishedAt: new Date(publishedAt),
    updatedAt: new Date(updatedAt),
    preTitle: article.preTitle,
    title: article.title,
    lead: article.lead,
    image: imageAdapter(article.image),
    slug: article.slug || undefined,
    authors: authorsAdapter(article.authors),
    isBreaking: article.breaking,
    tags: article.tags
  }
}

export function articleAdapter(article: any): PublishedArticle | null {
  if (!article) return null

  const articleMeta = articleMetaAdapter(article)

  return {
    ...articleMeta,
    blocks: getArticleBlocks(article.blocks, articleMeta)
  }
}

export function relatedArticlesAdapter(articles: any): (ArticleMeta | null)[] {
  return articles.map((article: any) => (article ? articleMetaAdapter(article) : null))
}
