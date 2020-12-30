import {RichTextNode} from '../graphql/richText'

export enum CommentStatus {
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
  Admin = 'admin',
  ArticleAuthor = 'articleAuthor',
  VerifiedUser = 'verifiedUser',
  PeerUser = 'peerUser',
  Journalist = 'journalist',
  Moderator = 'moderator'
}

export interface CommentData {
  siteID?: string
  userID: string
  peerID?: string
  permalink: string

  // comment could be on different types of data models
  articleID?: string
  imageID?: string

  revisions: [CommentRevision]
  parentID?: string

  authorType: CommentAuthorType
  status: CommentStatus
  rejectionReason: CommentRejectionReason
}

export interface Comment {
  readonly id: string

  readonly createdAt: Date
  readonly modifiedAt: Date
}

export interface CommentRevision {
  id: string
  text: RichTextNode[]
  createdAt: Date
  modifiedAt: Date
}

export type CommentInput = CommentData

export type PrivateComment = Comment & CommentData

export interface CreateCommentArgs {
  readonly input: CommentInput
}

export type OptionalComment = Comment | null

export interface DBCommentAdapter {
  createComment(args: CreateCommentArgs): Promise<PrivateComment>
  // getComments(args: GetCommentsArgs): Promise<ConnectionResult<Comment>>
}
