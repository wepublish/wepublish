import {CollectionName, MongoDBUser, MongoDBSession} from './adapter'
import {Db} from 'mongodb'

export enum MigrationName {
  Initial = 'initial'
}

export interface Migration {
  readonly name: MigrationName
  migrate(adapter: Db): Promise<void>
}

const SessionDocumentTTL = 60 * 60 * 24 // 24h

export const Migrations: Migration[] = [
  {
    name: MigrationName.Initial,
    async migrate(db) {
      const migrations = await db.createCollection(CollectionName.Migrations, {strict: true})

      await migrations.createIndex({name: 1}, {unique: true})

      const users = await db.createCollection<MongoDBUser>(CollectionName.Users, {strict: true})

      await users.createIndex({email: 1}, {unique: true})

      const sessions = await db.createCollection<MongoDBSession>(CollectionName.Sessions, {
        strict: true
      })

      await sessions.createIndex({token: 1}, {unique: true})
      await sessions.createIndex({expiresAt: 1}, {expireAfterSeconds: SessionDocumentTTL})

      await db.createCollection(CollectionName.Images, {strict: true})
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
