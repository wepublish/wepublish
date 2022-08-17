import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentState
} from '@prisma/client'
import {RichTextNode} from '../graphql/richText'

export interface CommentData {
  readonly id: string
  readonly userID?: string | null

  readonly authorType: CommentAuthorType

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string | null

  readonly createdAt: Date
  readonly modifiedAt: Date
}

export interface Comment extends CommentData {
  readonly revisions: CommentRevision[]

  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason | null
}

export interface CommentRevision {
  readonly text: RichTextNode[]
  readonly createdAt: Date
}

export interface PublicComment extends CommentData {
  readonly text: RichTextNode[]
}

export enum CommentSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

export interface CommentFilter {
  readonly states?: CommentState[]
}
