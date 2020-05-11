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

      await db.createCollection<v0.DBPeerProfile>(v0.CollectionName.PeerProfiles, {
        strict: true
      })

      const peers = await db.createCollection<v0.DBPeer>(v0.CollectionName.Peers, {
        strict: true
      })

      await peers.createIndex({slug: 1}, {unique: true})

      const tokens = await db.createCollection<v0.DBToken>(v0.CollectionName.Tokens, {
        strict: true
      })

      await tokens.createIndex({name: 1}, {unique: true})

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

      const navigations = await db.createCollection(v0.CollectionName.Navigations, {strict: true})

      await navigations.createIndex({createdAt: -1})
      await navigations.createIndex({modifiedAt: -1})
      await navigations.createIndex({name: 1})
      await navigations.createIndex({key: 1}, {unique: true})

      const authors = await db.createCollection(v0.CollectionName.Authors, {strict: true})

      await authors.createIndex({createdAt: -1})
      await authors.createIndex({modifiedAt: -1})
      await authors.createIndex({name: 1})
      await authors.createIndex({slug: 1}, {unique: true})

      const images = await db.createCollection(v0.CollectionName.Images, {strict: true})

      await images.createIndex({createdAt: -1})
      await images.createIndex({modifiedAt: -1})
      await images.createIndex({title: 1})
      await images.createIndex({tags: 1}, {collation: {locale, strength: 2}})

      const articles = await db.createCollection<v0.DBArticle>(v0.CollectionName.Articles, {
        strict: true
      })

      await articles.createIndex({createdAt: -1})
      await articles.createIndex({modifiedAt: -1})

      await articles.createIndex({'published.publishedAt': -1})
      await articles.createIndex({'published.updatedAt': -1})
      await articles.createIndex({'pending.publishAt': -1})

      await articles.createIndex({'draft.tags': 1}, {collation: {locale, strength: 2}})
      await articles.createIndex({'pending.tags': 1}, {collation: {locale, strength: 2}})
      await articles.createIndex({'published.tags': 1}, {collation: {locale, strength: 2}})

      await db.createCollection<v0.DBArticleHistoryRevision>(v0.CollectionName.ArticlesHistory, {
        strict: true
      })

      const pages = await db.createCollection<v0.DBPage>(v0.CollectionName.Pages, {
        strict: true
      })

      await pages.createIndex({createdAt: -1})
      await pages.createIndex({modifiedAt: -1})

      await pages.createIndex({'published.publishedAt': -1})
      await pages.createIndex({'published.updatedAt': -1})
      await pages.createIndex({'pending.publishAt': -1})

      await pages.createIndex({'draft.tags': 1}, {collation: {locale, strength: 2}})
      await pages.createIndex({'pending.tags': 1}, {collation: {locale, strength: 2}})
      await pages.createIndex({'published.tags': 1}, {collation: {locale, strength: 2}})

      // TODO: Add unique index for slug

      await db.createCollection<v0.DBPageHistoryRevision>(v0.CollectionName.PagesHistory, {
        strict: true
      })
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
