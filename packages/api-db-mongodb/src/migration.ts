import {Db} from 'mongodb'

import * as v0 from './schema/0'

export interface Migration {
  readonly version: number
  migrate(adapter: Db, locale: string): Promise<void>
}

const SessionDocumentTTL = 60 * 60 * 24 // 24h

export const Migrations: Migration[] = [
  {
    version: 0,
    async migrate(db, locale) {
      const migrations = await db.createCollection<v0.DBMigration>(v0.CollectionName.Migrations, {
        strict: true
      })

      await migrations.createIndex({name: 1}, {unique: true})

      const users = await db.createCollection<v0.DBUser>(v0.CollectionName.Users, {
        strict: true
      })

      await users.createIndex({email: 1}, {unique: true})

      const sessions = await db.createCollection<v0.DBSession>(v0.CollectionName.Sessions, {
        strict: true
      })

      await sessions.createIndex({userID: 1})
      await sessions.createIndex({token: 1}, {unique: true})
      await sessions.createIndex({expiresAt: 1}, {expireAfterSeconds: SessionDocumentTTL})

      const images = await db.createCollection(v0.CollectionName.Images, {strict: true})

      await images.createIndex({title: 1})

      const articles = await db.createCollection<v0.DBArticle>(v0.CollectionName.Articles, {
        strict: true
      })

      // TODO: Create required indicies
      await articles.createIndex({createdAt: -1})
      await articles.createIndex({modifiedAt: -1})

      await articles.createIndex({'published.publishedAt': -1})
      await articles.createIndex({'published.updatedAt': -1})
      await articles.createIndex({'pending.publishAt': -1})
      await articles.createIndex({'pending.publishAt': -1})

      await articles.createIndex({'draft.tags': 1}, {collation: {locale, strength: 2}})

      const articlesHistory = await db.createCollection<v0.DBArticleHistoryRevision>(
        v0.CollectionName.ArticlesHistory,
        {strict: true}
      )

      await articlesHistory
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
