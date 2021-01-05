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
  Admin = 'Admin',
  ArticleAuthor = 'ArticleAuthor',
  VerifiedUser = 'VerifiedUser',
  PeerUser = 'PeerUser',
  Journalist = 'Journalist',
  Moderator = 'Moderator'
}

export interface CommentData {
  userID: string
  peerID?: string

  itemId: string

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

export type CommentInput = CommentData

export interface CreateCommentArgs {
  readonly input: CommentInput
}

export type OptionalComment = Comment | null

export interface DBCommentAdapter {
  createComment(args: CreateCommentArgs): Promise<Comment>
  // getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
}
