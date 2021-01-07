import {RichTextNode} from '../graphql/richText'

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

export interface CreateCommentArgs {
  readonly input: CommentData
}

export type OptionalComment = Comment | null

export interface DBCommentAdapter {
  createComment(args: CreateCommentArgs): Promise<Comment>
  // getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
}
