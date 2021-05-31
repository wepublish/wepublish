import {Db} from 'mongodb'

import * as v0 from './schema/0'

export interface Migration {
  readonly version: number
  migrate(adapter: Db, locale: string): Promise<void>
}

//const SessionDocumentTTL = 60 * 60 * 24 // 24h

export const Migrations: Migration[] = [
  {
    version: 0,
    async migrate(db, locale) {
      const migrations = await db.createCollection<v0.DBMigration>(v0.CollectionName.Migrations, {
        strict: true
      })

      await migrations.createIndex({name: 1}, {unique: true})

      const accessToken = await db.createCollection<v0.DBOAuth2Token>(
        v0.CollectionName.AccessToken,
        {
          strict: true
        }
      )
      await accessToken.createIndex({'payload.grantId': 1})

      const authorizationCode = await db.createCollection<v0.DBOAuth2Token>(
        v0.CollectionName.AuthorizationCode,
        {
          strict: true
        }
      )
      await authorizationCode.createIndex({'payload.grantId': 1})

      const session = await db.createCollection<v0.DBOAuth2Token>(v0.CollectionName.Session, {
        strict: true
      })
      await session.createIndex({'payload.uid': 1}, {unique: true})
    }
  }
]

export const LatestMigration = Migrations[Migrations.length - 1]
