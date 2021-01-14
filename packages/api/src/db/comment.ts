import {RichTextNode} from '../graphql/richText'
import {SortOrder, Limit, InputCursor, ConnectionResult} from './common'

export enum CommentState {
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

export interface CreateCommentArgs {
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

export interface GetCommentsForItemByIDArgs {
  itemID?: readonly string[]
}

export type OptionalComment = Comment | null
export type OptionalPublicComment = PublicComment | null

export interface DBCommentAdapter {
  createComment(args: CreateCommentArgs): Promise<PublicComment>
  getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
  getCommentsForItemByID(ids: readonly string[]): Promise<PublicComment[]>
}
