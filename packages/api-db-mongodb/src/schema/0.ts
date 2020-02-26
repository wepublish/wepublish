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

export interface DBMigration {
  readonly _id: any
  readonly version: number
  readonly createdAt: Date
}

export interface DBUser {
  readonly _id: any
  readonly email: string
  readonly password: string
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

export interface DBSession {
  readonly _id: any
  readonly userID: string
  readonly token: string
  readonly createdAt: Date
  readonly expiresAt: Date
}

export interface DBArticle {
  readonly _id: any

  readonly shared: boolean
  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly draft: DBArticleRevision | null
  readonly published: DBArticleRevision | null
  readonly pending: DBArticleRevision | null
}

export interface DBArticleRevision {
  readonly revision: number
  readonly createdAt: Date

  readonly updatedAt?: Date
  readonly publishedAt?: Date
  readonly publishAt?: Date

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

export interface DBArticleHistoryRevision extends DBArticleRevision {
  readonly _id: any
  readonly articleID: string
}
