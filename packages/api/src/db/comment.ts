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
  VerifiedUser = 'verifiedUser',
  GuestUser = 'guestUser'
}

export enum CommentItemType {
  Article = 'article',
  Page = 'page'
}

export interface CommentData {
  readonly id: string
  readonly userID: string

  readonly authorType: CommentAuthorType

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string

  readonly createdAt: Date
  readonly modifiedAt: Date
}

export interface Comment extends CommentData {
  readonly revisions: CommentRevision[]

  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason
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

export interface TakeActionOnCommentArgs {
  readonly id: string

  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason
}

export interface CommentInput {
  readonly userID: string

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string

  readonly state: CommentState
  readonly authorType: CommentAuthorType

  readonly text: RichTextNode[]
}

export interface AddPublicCommentArgs {
  readonly input: CommentInput
}

export interface UpdatePublicCommentArgs {
  readonly id: string

  readonly state: CommentState

  readonly text: RichTextNode[]
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

export interface GetPublicCommentsArgs {
  readonly id: string
  readonly userID?: string
}

export type OptionalPublicComment = PublicComment | null

export type OptionalComment = Comment | null

export interface DBCommentAdapter {
  addPublicComment(args: AddPublicCommentArgs): Promise<PublicComment>
  updatePublicComment(args: UpdatePublicCommentArgs): Promise<OptionalPublicComment>
  getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
  getPublicCommentsForItemByID(args: GetPublicCommentsArgs): Promise<PublicComment[]>
  getPublicChildrenCommentsByParentId(id: string, userID: string): Promise<PublicComment[]>
  getCommentById(id: string): Promise<OptionalComment>
  takeActionOnComment(args: TakeActionOnCommentArgs): Promise<OptionalComment>
}
