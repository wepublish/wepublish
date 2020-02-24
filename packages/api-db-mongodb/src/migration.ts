import {Db} from 'mongodb'

import * as v0 from './schema/0'

export interface Migration {
  readonly version: number
  migrate(adapter: Db): Promise<void>
}

const SessionDocumentTTL = 60 * 60 * 24 // 24h

export const Migrations: Migration[] = [
  {
    version: 0,
    async migrate(db) {
      const migrations = await db.createCollection(v0.CollectionName.Migrations, {strict: true})

      await migrations.createIndex({name: 1}, {unique: true})

      const users = await db.createCollection<v0.MongoDBUser>(v0.CollectionName.Users, {
        validator: {
          $jsonSchema: v0.MongoDBUserSchema
        },
        strict: true
      })

      await users.createIndex({email: 1}, {unique: true})

      // TODO: Create schema for all collections
      const sessions = await db.createCollection<v0.MongoDBSession>(v0.CollectionName.Sessions, {
        strict: true
      })

      await sessions.createIndex({userID: 1})
      await sessions.createIndex({token: 1}, {unique: true})
      await sessions.createIndex({expiresAt: 1}, {expireAfterSeconds: SessionDocumentTTL})

      const images = await db.createCollection(v0.CollectionName.Images, {strict: true})

      await images.createIndex({title: 1})

      const articles = await db.createCollection<v0.MongoDBArticle>(v0.CollectionName.Articles, {
        strict: true
      })

      // TODO: Create required indicies
      await articles.createIndex({'draft.createdAt': 1})

      const articlesHistory = await db.createCollection<v0.MongoDBArticleHistoryRevision>(
        v0.CollectionName.ArticlesHistory,
        {strict: true}
      )

      await articlesHistory
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
