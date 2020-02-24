import {ArticleBlock} from '@wepublish/api'

export enum CollectionName {
  Migrations = 'migrations',
  Users = 'users',
  Sessions = 'sessions',
  Images = 'images',

  Articles = 'articles',
  ArticlesHistory = 'articles.history',

  Pages = 'pages',
  PagesHistory = 'pages.history'
}

export interface MongoDBMigration {
  readonly _id: any
  readonly version: number
  readonly createdAt: Date
}

export interface MongoDBUser {
  readonly _id: any
  readonly email: string
  readonly password: string
}

export const MongoDBUserSchema = {
  bsonType: 'object',
  additionalProperties: false,
  required: ['_id', 'email', 'password'],
  properties: {
    _id: {bsonType: 'string'},
    email: {bsonType: 'string'},
    password: {bsonType: 'string'}
  }
}

export interface MongoDBSession {
  readonly _id: any
  readonly userID: string
  readonly token: string
  readonly createdAt: Date
  readonly expiresAt: Date
}

export interface MongoDBArticle {
  readonly _id: any

  readonly shared: boolean
  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly draft: MongoDBArticleRevision
  readonly published?: MongoDBArticleRevision
  readonly pending?: MongoDBArticleRevision
}

export interface MongoDBArticleRevision {
  readonly revision: number
  readonly createdAt: Date

  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly preTitle?: string
  readonly title: string
  readonly lead?: string
  readonly slug: string
  readonly tags: string[]

  readonly imageID?: string
  readonly authorIDs: string[]

  readonly breaking: boolean
  readonly blocks: ArticleBlock[]
}

export interface MongoDBArticleHistoryRevision extends MongoDBArticleRevision {
  readonly _id: any
  readonly articleID: string
}
