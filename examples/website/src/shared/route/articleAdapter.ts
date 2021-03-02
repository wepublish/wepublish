// import { User } from '../../../../../packages/api/lib/db/user'
import {PublishedArticle, Author, ArticleMeta, Comment, Peer} from '../types'
import {imageAdapter, getArticleBlocks} from './blockAdapters'

export function peerAdapter(peer: any): Peer {
  return {
    id: peer.id,
    slug: peer.slug,
    name: peer.profile.name,
    logoURL: peer.profile.logo?.squareURL,
    websiteURL: peer.profile.websiteURL,
    themeColor: peer.profile.themeColor,
    callToActionText: peer.profile.callToActionText,
    callToActionURL: peer.profile.callToActionURL
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

export function commentsAdapter(comments: any): Comment[] {
  return comments?.map((comment: Comment) => {
    return {
      id: comment.id,
      state: comment.state,
      rejectionReason: comment.rejectionReason,
      text: comment.text,
      itemType: comment.itemType,
      itemID: comment.itemID,
      modifiedAt: comment.modifiedAt,
      parentID: comment.parentID,
      authorType: comment.authorType,
      userName: comment.user.name,
      children: comment.children
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
    tags: article.tags,
    socialMediaTitle: article.socialMediaTitle,
    socialMediaDescription: article.socialMediaDescription,
    socialMediaAuthors: authorsAdapter(article.socialMediaAuthors),
    socialMediaImage: imageAdapter(article.socialMediaImage),
    comments: commentsAdapter(article.comments)
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
