import {MongoClient, Db} from 'mongodb'
import snakeCase from 'lodash/snakeCase'

import {Migrations, LatestMigration} from './migrations'
import {CollectionName, DBMigration} from './schema'

export interface MongoDBAdapterInitializeArgs {
  readonly url: string
  readonly database: string
  readonly locale: string
  readonly seed?: (adapter: MongoDBAdapter) => Promise<void>
}

export interface InitializationResult {
  readonly migrated?: {
    readonly from?: number
    readonly to: number
  }
}

enum SortOrder {
  Ascending = 1,
  Descending = -1
}

export class MongoDBAdapter {
  static DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7 // 1w
  static DefaultBcryptHashCostFactor = 11
  static MaxResultsPerPage = 100
  static DatabaseName = 'oauth2'

  private readonly name: string
  private static client: Db

  constructor(name: string) {
    this.name = snakeCase(name)
  }

  // NOTE: the payload for Session model may contain client_id as keys, make sure you do not use
  //   dots (".") in your client_id value charset.
  async upsert(_id: string, payload: any, expiresIn: number) {
    let expiresAt

    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000)
    }

    await this.coll(this.name).updateOne(
      {_id},
      {$set: {payload, ...(expiresAt ? {expiresAt} : undefined)}},
      {upsert: true}
    )
  }

  async find(_id: string) {
    const result = await this.coll(this.name)
      .find(
        {_id}
        //{ payload: 1 },
      )
      .limit(1)
      .next()

    if (!result) return undefined
    return result.payload
  }

  async findByUserCode(userCode: string) {
    const result = await this.coll(this.name)
      .find(
        {'payload.userCode': userCode}
        //  { payload: 1 },
      )
      .limit(1)
      .next()

    if (!result) return undefined
    return result.payload
  }

  async findByUid(uid: string) {
    const result = await this.coll(this.name)
      .find(
        {'payload.uid': uid}
        //  { payload: 1 },
      )
      .limit(1)
      .next()

    if (!result) return undefined
    return result.payload
  }

  async destroy(_id: string) {
    await this.coll(this.name).deleteOne({_id})
  }

  async revokeByGrantId(grantId: string) {
    await this.coll(this.name).deleteMany({'payload.grantId': grantId})
  }

  async consume(_id: string) {
    await this.coll(this.name).findOneAndUpdate(
      {_id},
      {$set: {'payload.consumed': Math.floor(Date.now() / 1000)}}
    )
  }

  coll(name: string) {
    return MongoDBAdapter.client.collection(name)
  }

  // This is not part of the required or supported API, all initialization should happen before
  // you pass the adapter to `new Provider`
  static async connect(url: string) {
    const connection = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    this.client = connection.db()

    const migrationState = await this.getDBMigrationState(this.client)

    if (migrationState?.version !== LatestMigration.version) {
      throw new Error(
        'Database is not initialized or out of date, call `initialize` to intialize/migrate database.'
      )
    }
  }

  static async getDBMigrationState(db: Db): Promise<DBMigration | null> {
    const result = await db
      .collection<DBMigration>(CollectionName.Migrations)
      .findOne({}, {sort: {createdAt: SortOrder.Descending}})

    return result
  }

  static async initialize(url: string, locale: string): Promise<InitializationResult> {
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    const db = client.db()

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.version === LatestMigration.version) {
      return {}
    }

    const index = Migrations.findIndex(migration => migration.version === migrationState?.version)
    const remainingMigrations = Migrations.slice(index + 1)

    for (const migration of remainingMigrations) {
      await migration.migrate(db, locale)
      await db.collection<DBMigration>(CollectionName.Migrations).insertOne({
        version: migration.version,
        createdAt: new Date()
      })
    }

    return {
      migrated: {
        from: migrationState?.version,
        to: LatestMigration.version
      }
    }
  }
}
