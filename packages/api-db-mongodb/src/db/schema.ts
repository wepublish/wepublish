import {
  ArticleBlock,
  FocalPoint,
  MetadataProperty,
  NavigationLink,
  PageBlock,
  RichTextNode
} from '@dev7ch/wepublish-api'

export enum CollectionName {
  Migrations = 'migrations',

  PeerProfiles = 'peerProfiles',
  Peers = 'peers',
  Users = 'users',
  UserRoles = 'users.roles',

  Sessions = 'sessions',
  Tokens = 'tokens',

  Navigations = 'navigations',
  Authors = 'authors',
  Images = 'images',

  Articles = 'articles',
  ArticlesHistory = 'articles.history',

  Pages = 'pages',
  PagesHistory = 'pages.history'
}

// NOTE: _id has to be of type any for insert operations not requiring _id to be provided.
export interface DBMigration {
  _id: any
  version: number
  createdAt: Date
}

export interface DBPeerProfile {
  _id: any

  name: string
  logoID?: string
  themeColor: string
}

export interface DBPeer {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  slug: string
  hostURL: string
  token: string
}

export interface DBToken {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  token: string

  roleIDs: string[]
}

export interface DBUser {
  _id: any

  createdAt: Date
  modifiedAt: Date

  email: string
  name: string
  password: string

  roleIDs: string[]
}

export interface DBUserRole {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  description?: string
  systemRole: boolean

  permissionIDs: string[]
}

export interface DBSession {
  _id: any

  createdAt: Date
  expiresAt: Date

  userID: string
  token: string
}

export interface DBNavigation {
  _id: any

  createdAt: Date
  modifiedAt: Date

  key: string
  name: string
  links: NavigationLink[]
}

export interface DBAuthor {
  _id: any

  createdAt: Date
  modifiedAt: Date

  slug: string
  name: string
  imageID?: string

  links: Array<{title: string; url: string}>
  bio: RichTextNode[]
}

// TODO: Consider using DB schema via $jsonSchema
// export const DBUserSchema = {
//   bsonType: 'object',
//   additionalProperties: false,
//   required: ['_id', 'email', 'password'],
//   properties: {
//     _id: {bsonType: 'string'},
//     email: {bsonType: 'string'},
//     password: {bsonType: 'string'}
//   }
// }
//
// const users = await db.createCollection<v0.DBUser>(v0.CollectionName.Users, {
//   validator: {
//     $jsonSchema: v0.DBUserSchema
//   },
//   strict: true
// })

export interface DBImage {
  _id: any

  createdAt: Date
  modifiedAt: Date

  fileSize: number
  extension: string
  mimeType: string
  format: string
  width: number
  height: number

  filename?: string
  title?: string
  description?: string
  tags: string[]

  author?: string
  source?: string
  license?: string

  focalPoint?: FocalPoint
}

export interface DBArticle {
  _id: any

  shared: boolean
  createdAt: Date
  modifiedAt: Date

  draft: DBArticleRevision | null
  published: DBArticleRevision | null
  pending: DBArticleRevision | null
}

export interface DBArticleRevision {
  revision: number
  createdAt: Date

  updatedAt?: Date
  publishedAt?: Date
  publishAt?: Date

  slug: string

  preTitle?: string
  title: string
  lead?: string
  tags: string[]

  properties: MetadataProperty[]

  imageID?: string
  authorIDs: string[]

  breaking: boolean
  blocks: ArticleBlock[]
}

export interface DBArticleHistoryRevision extends DBArticleRevision {
  _id: any
  articleID: string
}

export interface DBPage {
  _id: any

  createdAt: Date
  modifiedAt: Date

  draft: DBPageRevision | null
  published: DBPageRevision | null
  pending: DBPageRevision | null
}

export interface DBPageRevision {
  revision: number
  createdAt: Date

  updatedAt?: Date
  publishedAt?: Date
  publishAt?: Date

  slug: string

  title: string
  description?: string
  tags: string[]

  properties: MetadataProperty[]

  imageID?: string

  blocks: PageBlock[]
}

export interface DBPageHistoryRevision extends DBPageRevision {
  _id: any
  articleID: string
}
