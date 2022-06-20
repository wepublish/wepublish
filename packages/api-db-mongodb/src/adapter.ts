import {MongoClient, Db} from 'mongodb'

import {DBAdapter, SortOrder} from '@wepublish/api'

import {Migrations, LatestMigration} from './migration'
import {generateID} from './utility'

import {MongoDBUserAdapter} from './db/user'
import {MongoDBPeerAdapter} from './db/peer'
import {MongoDBImageAdapter} from './db/image'
import {DefaultSessionTTL, DefaultBcryptHashCostFactor} from './db/defaults'
import {MongoDBCommentAdapter} from './db/comment'
import {MongoDBArticleAdapter} from './db/article'
import {MongoDBPageAdapter} from './db/page'
import {DBMigration, CollectionName} from './db/schema'
import {MongoDBMemberPlanAdapter} from './db/memberPlan'
import {MongoDBPaymentMethodAdapter} from './db/paymentMethod'
import {MongoDBPaymentAdapter} from './db/payment'
import {MongoDBSubscriptionAdapter} from './db/subscription'

export interface MongoDBAdabterCommonArgs {
  readonly sessionTTL?: number
  readonly bcryptHashCostFactor?: number
}

export interface MongoDBAdapterConnectArgs extends MongoDBAdabterCommonArgs {
  readonly url: string
  readonly locale: string
}

export interface MongoDBAdapterInitializeArgs extends MongoDBAdabterCommonArgs {
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

interface MongoDBAdapterArgs extends MongoDBAdabterCommonArgs {
  readonly locale: string
  readonly client: MongoClient
  readonly db: Db
}

export class MongoDBAdapter implements DBAdapter {
  readonly sessionTTL: number
  readonly bcryptHashCostFactor: number

  readonly locale: string
  readonly client: MongoClient
  readonly db: Db

  readonly peer: MongoDBPeerAdapter
  readonly user: MongoDBUserAdapter
  readonly subscription: MongoDBSubscriptionAdapter
  readonly image: MongoDBImageAdapter
  readonly comment: MongoDBCommentAdapter
  readonly article: MongoDBArticleAdapter
  readonly page: MongoDBPageAdapter
  readonly memberPlan: MongoDBMemberPlanAdapter
  readonly paymentMethod: MongoDBPaymentMethodAdapter
  readonly payment: MongoDBPaymentAdapter

  // Init
  // ====

  private constructor({
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
    locale,
    client,
    db
  }: MongoDBAdapterArgs) {
    this.sessionTTL = sessionTTL
    this.bcryptHashCostFactor = bcryptHashCostFactor

    this.locale = locale
    this.client = client
    this.db = db

    this.peer = new MongoDBPeerAdapter(db)
    this.user = new MongoDBUserAdapter(db, bcryptHashCostFactor)
    this.subscription = new MongoDBSubscriptionAdapter(db)
    this.comment = new MongoDBCommentAdapter(db)
    this.image = new MongoDBImageAdapter(db)
    this.article = new MongoDBArticleAdapter(db)
    this.page = new MongoDBPageAdapter(db)
    this.memberPlan = new MongoDBMemberPlanAdapter(db)
    this.paymentMethod = new MongoDBPaymentMethodAdapter(db)
    this.payment = new MongoDBPaymentAdapter(db)
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

  static async connect({
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
    url,
    locale
  }: MongoDBAdapterConnectArgs) {
    const client = await this.createMongoClient(url)
    const db = client.db()

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.version !== LatestMigration.version) {
      throw new Error(
        'Database is not initialized or out of date, call `initialize` to intialize/migrate database.'
      )
    }

    return new MongoDBAdapter({
      sessionTTL,
      bcryptHashCostFactor,
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
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
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
      const adapter = await this.connect({sessionTTL, bcryptHashCostFactor, url, locale})
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
