import {RichTextNode} from '../graphql/richText'
import {SortOrder, Limit, InputCursor, ConnectionResult} from './common'

export enum CommentState {
  Approved = 'approved',
  PendingApproval = 'pendingApproval',
  PendingUserChanges = 'pendingUserChanges',
  Rejected = 'rejected'
}

export enum CommentRejectionReason {
  Misconduct = 'misconduct',
  Spam = 'spam'
}

export enum CommentAuthorType {
  Team = 'team',
  Author = 'author',
  VerifiedUser = 'verifiedUser'
}

export enum CommentItemType {
  Article = 'article',
  Page = 'page'
}

export interface CommentData {
  readonly userID: string

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string
}

export interface Comment extends CommentData {
  readonly id: string

  readonly authorType: CommentAuthorType

  readonly revisions: CommentRevision[]

  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason

  readonly createdAt: Date
  readonly modifiedAt: Date
}

export interface CommentRevision {
  text: RichTextNode[]
  createdAt: Date
}

export interface PublicComment extends CommentData {
  readonly id: string

  readonly authorType: CommentAuthorType

  readonly text: RichTextNode[]

  readonly modifiedAt: Date
}

export enum CommentSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

export interface CommentInput extends CommentData {
  readonly text: RichTextNode[]
}

export interface AddPublicCommentArgs {
  readonly input: CommentInput
}

export interface CommentFilterOptions {
  readonly state?: CommentState
}

export interface GetCommentsArgs {
  readonly filter?: CommentFilterOptions
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly sort: CommentSort
  readonly order: SortOrder
}

export type OptionalPublicComment = PublicComment | null

export interface DBCommentAdapter {
  addPublicComment(args: AddPublicCommentArgs): Promise<PublicComment>
  getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
  getCommentsForItemByID(id: readonly string[]): Promise<PublicComment[]>
}
