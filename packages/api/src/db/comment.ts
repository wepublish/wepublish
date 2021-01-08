import {RichTextNode} from '../graphql/richText'
import {ConnectionResult} from './common'
// import {ConnectionResult} from './common'

export enum CommentStatus {
  Approved = 'Approved',
  PendingApproval = 'PendingApproval',
  PendingUserChanges = 'PendingUserChanges',
  Rejected = 'Rejected'
}

export enum CommentRejectionReason {
  Misconduct = 'Misconduct',
  Spam = 'Spam'
}

export enum CommentAuthorType {
  Team = 'Team',
  Author = 'Author',
  VerifiedUser = 'VerifiedUser'
}

export enum CommentItemType {
  Article = 'Article',
  Page = 'Page'
}

export interface CommentData {
  userID: string

  itemID: string
  itemType: CommentItemType

  revisions: [CommentRevision]
  parentID?: string

  authorType: CommentAuthorType
  status: CommentStatus
  rejectionReason?: CommentRejectionReason
}

export interface Comment extends CommentData {
  readonly id: string

  readonly createdAt: Date
  readonly modifiedAt: Date
}

export interface CommentRevision {
  text: RichTextNode[]
  createdAt: Date
}

export interface PublicComment extends CommentData {
  readonly id: string

  readonly createdAt: Date
}

export type CommentInput = CommentData

export type PrivateComment = Comment & CommentData

export interface CreateCommentArgs {
  readonly input: CommentData
}

export interface GetCommentsArgs {
  articleID?: readonly string[]
  imageID?: readonly string[]
}

export interface GetPublicCommentsArgs {
  articleID?: readonly string[]
  imageID?: readonly string[]
}

export type OptionalComment = PrivateComment | null
export type OptionalPublicComment = PublicComment | null

export interface DBCommentAdapter {
  createComment(args: CreateCommentArgs): Promise<Comment>
  getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
  getPublicComments(args: GetPublicCommentsArgs): Promise<PublicComment[]>
}
