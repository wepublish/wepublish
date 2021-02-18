// import { User } from '../../../../../packages/api/lib/db/user'
import {PublishedPage, Author, PageMeta, Comment, Peer} from '../types'
import {imageAdapter, getPageBlocks} from './blockAdapters'

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

function pageMetaAdapter(page: any): PageMeta {
  const {publishedAt, updatedAt} = page

  return {
    id: page.id,
    url: page.url,
    publishedAt: new Date(publishedAt),
    updatedAt: new Date(updatedAt),
    title: page.title,
    description: page.description,
    image: imageAdapter(page.image),
    slug: page.slug || undefined,
    tags: page.tags,
    socialMediaTitle: page.socialMediaTitle,
    socialMediaDescription: page.socialMediaDescription,
    socialMediaImage: imageAdapter(page.socialMediaImage),
    comments: commentsAdapter(page.comments)
  }
}

export function pageAdapter(page: any): PublishedPage | null {
  if (!page) return null

  const pageMeta = pageMetaAdapter(page)

  return {
    ...pageMeta,
    blocks: getPageBlocks(page.blocks, pageMeta)
  }
}

export function relatedPagesAdapter(pages: any): (PageMeta | null)[] {
  return pages.map((page: any) => (page ? pageMetaAdapter(page) : null))
}
