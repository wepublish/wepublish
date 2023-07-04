import {
  CommentAuthorType,
  CommentItemType,
  CommentRatingOverride,
  CommentRejectionReason,
  CommentState
} from '@prisma/client'
import {RichTextNode} from '@wepublish/richtext/api'

export interface CommentData {
  readonly id: string
  readonly userID?: string | null

  readonly authorType: CommentAuthorType

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string | null
  readonly source?: string | null
  readonly guestUserImageID?: string | null

  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly overriddenRatings?: CommentRatingOverride[] | null
  readonly revisions: CommentRevision[]
}

export interface Comment extends CommentData {
  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason | null
}

export interface CommentRevision {
  readonly text: RichTextNode[]
  readonly title: string | null
  readonly lead: string | null
  readonly createdAt: Date
}

export interface PublicComment extends CommentData {
  readonly text: RichTextNode[]
}

export enum CommentSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

export enum PublicCommentSort {
  Rating = 'rating'
}

export interface CommentFilter {
  readonly states?: CommentState[]
  readonly tags?: string[]
  readonly itemType?: CommentItemType
  readonly itemID?: string
  readonly item?: string
}
