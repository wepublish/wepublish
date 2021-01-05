import {RichTextNode} from '../graphql/richText'
import {ConnectionResult} from './common'
// import {ConnectionResult} from './common'

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
  permalink?: string

  // comment could be on different types of data models
  articleID?: string
  imageID?: string

  revisions: [CommentRevision]
  parentID?: string

  authorType: CommentAuthorType
  status: CommentStatus
  rejectionReason?: CommentRejectionReason
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
}

export interface PublicComment extends CommentData {
  readonly id: string

  readonly createdAt: Date
}

export type CommentInput = CommentData

export type PrivateComment = Comment & CommentData

export interface CreateCommentArgs {
  readonly input: CommentInput
}

export interface GetPrivateCommentsArgs {
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
  createComment(args: CreateCommentArgs): Promise<PrivateComment>
  getPrivateComments(args: GetPrivateCommentsArgs): Promise<ConnectionResult<PrivateComment[]>>
  getPublicComments(args: GetPublicCommentsArgs): Promise<PublicComment[]>
}
