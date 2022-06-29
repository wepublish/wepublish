import {RichTextNode} from '../graphql/richText'

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

export interface TakeActionOnCommentArgs {
  readonly id: string

  readonly state: CommentState

  readonly rejectionReason?: CommentRejectionReason | null
}

export interface CommentInput {
  readonly userID: string

  readonly itemID: string
  readonly itemType: CommentItemType

  readonly parentID?: string | null

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

export interface CommentFilter {
  readonly states?: CommentState[]
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
  takeActionOnComment(args: TakeActionOnCommentArgs): Promise<OptionalComment>
}
