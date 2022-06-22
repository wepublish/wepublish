import {MongoClient, Db} from 'mongodb'

import {DBAdapter, SortOrder} from '@wepublish/api'

import {Migrations, LatestMigration} from './migration'
import {generateID} from './utility'

import {MongoDBArticleAdapter} from './db/article'
import {MongoDBPageAdapter} from './db/page'
import {DBMigration, CollectionName} from './db/schema'
import {MongoDBSubscriptionAdapter} from './db/subscription'

export interface MongoDBAdapterConnectArgs {
  readonly url: string
  readonly locale: string
}

export interface MongoDBAdapterInitializeArgs {
  readonly url: string
  readonly locale: string
  readonly seed?: (adapter: MongoDBAdapter) => Promise<void>
}

export interface InitializationResult {
  readonly migrated?: {
    readonly from?: number
    readonly to: number
  }
}

interface MongoDBAdapterArgs {
  readonly locale: string
  readonly client: MongoClient
  readonly db: Db
}

export class MongoDBAdapter implements DBAdapter {
  readonly locale: string
  readonly client: MongoClient
  readonly db: Db

  readonly subscription: MongoDBSubscriptionAdapter
  readonly article: MongoDBArticleAdapter
  readonly page: MongoDBPageAdapter

  // Init
  // ====

  private constructor({locale, client, db}: MongoDBAdapterArgs) {
    this.locale = locale
    this.client = client
    this.db = db

    this.subscription = new MongoDBSubscriptionAdapter(db)
    this.article = new MongoDBArticleAdapter(db)
    this.page = new MongoDBPageAdapter(db)
  }

  static createMongoClient(url: string): Promise<MongoClient> {
    return MongoClient.connect(url, {
      pkFactory: {
        createPk() {
          return generateID()
        }
      },
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  }

  static async connect({url, locale}: MongoDBAdapterConnectArgs) {
    const client = await this.createMongoClient(url)
    const db = client.db()

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.version !== LatestMigration.version) {
      throw new Error(
        'Database is not initialized or out of date, call `initialize` to intialize/migrate database.'
      )
    }

    return new MongoDBAdapter({
      client,
      db,
      locale
    })
  }

  static async getDBMigrationState(db: Db): Promise<DBMigration | null> {
    const result = await db
      .collection<DBMigration>(CollectionName.Migrations)
      .findOne({}, {sort: {createdAt: SortOrder.Descending}})
    return result
  }

  static async initialize({
    url,
    locale,
    seed
  }: MongoDBAdapterInitializeArgs): Promise<InitializationResult> {
    const client = await this.createMongoClient(url)
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

    if (!migrationState) {
      const adapter = await this.connect({url, locale})
      await seed?.(adapter)
      await adapter.client.close()
    }

    await client.close()

    return {
      migrated: {
        from: migrationState?.version,
        to: LatestMigration.version
      }
    }
  }
}
