import bcrypt from 'bcrypt'

import {MongoClient, Db, Collection, MongoError} from 'mongodb'

import {
  DBAdapter,
  CreateUserArgs,
  GetUserForCredentialsArgs,
  User,
  OptionalUser,
  OptionalImage,
  CreateImageArgs,
  UpdateImageArgs,
  OptionalSessionWithToken,
  Session,
  OptionalSession,
  Article,
  CreateArticleArgs,
  CreateArticleVersionArgs,
  UpdateArticleVersionArgs,
  PublishArticleArgs,
  GetArticlesArgs,
  ArticleBlock,
  ArticlesResult,
  PublishedArticleResult
} from '@wepublish/api'

import {MigrationName, Migrations, LatestMigration} from './migration'
import {generateID, generateToken} from './utility'

import {OptionalAuthor} from '@wepublish/api/lib/db/author'

export enum CollectionName {
  Migrations = 'migrations',
  Users = 'users',
  Sessions = 'sessions',
  Images = 'images',

  Articles = 'articles'
}

export enum MongoErrorCode {
  DuplicateKey = 11000
}

export interface MongoDBUser {
  readonly _id: any
  readonly email: string
  readonly password: string
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

  readonly latest: MongoDBArticleRevision
  readonly published?: MongoDBArticleRevision
  readonly pending?: MongoDBArticleRevision

  readonly history: MongoDBArticleRevision[]
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

export interface MongoDBAdabterSharedArgs {
  readonly sessionTTL?: number
  readonly bcryptHashCostFactor?: number
}

export interface MongoDBAdapterConnectArgs extends MongoDBAdabterSharedArgs {
  readonly url: string
  readonly database: string
}

export interface MongoDBAdapterInitializeArgs extends MongoDBAdabterSharedArgs {
  readonly url: string
  readonly database: string
  readonly seed?: (adapter: MongoDBAdapter) => Promise<void>
}

export interface MigrationState {
  readonly name: MigrationName
  readonly createdAt: Date
}

export interface InitializationResult {
  readonly migrated?: {
    readonly from?: MigrationName
    readonly to: MigrationName
  }
}

const DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7 // 1w
const DefaultBcryptHashCostFactor = 11
const MaxResultsPerPage = 100

interface MongoDBAdapterArgs extends MongoDBAdabterSharedArgs {
  readonly client: MongoClient
  readonly db: Db
  readonly users: Collection<MongoDBUser>
  readonly sessions: Collection<MongoDBSession>
  readonly articles: Collection<MongoDBArticle>
}

export class PKFactory {
  createPk() {
    return generateID()
  }
}

export class MongoDBAdapter implements DBAdapter {
  readonly sessionTTL: number
  readonly bcryptHashCostFactor: number

  readonly client: MongoClient
  readonly db: Db

  readonly users: Collection<MongoDBUser>
  readonly sessions: Collection<MongoDBSession>
  readonly articles: Collection<MongoDBArticle>

  private constructor({
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
    client,
    db,
    users,
    sessions,
    articles
  }: MongoDBAdapterArgs) {
    this.sessionTTL = sessionTTL
    this.bcryptHashCostFactor = bcryptHashCostFactor

    this.client = client
    this.db = db
    this.users = users
    this.sessions = sessions
    this.articles = articles
  }

  static async createMongoClient(url: string): Promise<MongoClient> {
    return MongoClient.connect(url, {
      pkFactory: new PKFactory(),
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  }

  static async connect({
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
    url,
    database
  }: MongoDBAdapterConnectArgs) {
    const client = await this.createMongoClient(url)
    const db = client.db(database)

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.name !== LatestMigration.name) {
      throw new Error(
        'Database is not initialized or out of date, call `initialize` to intialize/migrate database.'
      )
    }

    return new MongoDBAdapter({
      sessionTTL,
      bcryptHashCostFactor,
      client,
      db,
      users: db.collection(CollectionName.Users),
      sessions: db.collection(CollectionName.Sessions),
      articles: db.collection(CollectionName.Articles)
    })
  }

  static async getDBMigrationState(db: Db): Promise<MigrationState | null> {
    const result = await db
      .collection(CollectionName.Migrations)
      .findOne({}, {sort: {createdAt: -1}})

    return result
  }

  static async initialize({
    sessionTTL = DefaultSessionTTL,
    bcryptHashCostFactor = DefaultBcryptHashCostFactor,
    url,
    database,
    seed
  }: MongoDBAdapterInitializeArgs): Promise<InitializationResult> {
    const client = await this.createMongoClient(url)
    const db = client.db(database)

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.name === LatestMigration.name) {
      return {}
    }

    const index = Migrations.findIndex(migration => migration.name === migrationState?.name)
    const remainingMigrations = Migrations.slice(index + 1)

    for (const migration of remainingMigrations) {
      await migration.migrate(db)

      db.collection(CollectionName.Migrations).insertOne({
        name: migration.name,
        createdAt: new Date()
      })
    }

    if (!migrationState) {
      const adapter = await this.connect({sessionTTL, bcryptHashCostFactor, url, database})
      await seed?.(adapter)
    }

    return {
      migrated: {
        from: migrationState?.name,
        to: LatestMigration.name
      }
    }
  }

  async createUser({email, password}: CreateUserArgs): Promise<User> {
    try {
      const passwordHash = await bcrypt.hash(password, this.bcryptHashCostFactor)
      const {insertedId: id} = await this.users.insertOne({
        email,
        password: passwordHash
      })

      return {id, email}
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  async getUsersByID(ids: string[]): Promise<OptionalUser[]> {
    const users = await this.users.find({_id: {$in: ids}}).toArray()

    return users.map<OptionalUser>(user => ({
      id: user._id,
      email: user.email
    }))
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {id: user._id, email: user.email}
    }

    return null
  }

  createImage(image: CreateImageArgs): Promise<OptionalImage> {
    throw new Error('Method not implemented.')
  }

  updateImage(image: UpdateImageArgs): Promise<OptionalImage> {
    throw new Error('Method not implemented.')
  }

  deleteImage(id: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  getImagesByID(ids: readonly string[]): Promise<OptionalImage[]> {
    throw new Error('Method not implemented.')
  }

  // Session
  // =======

  async createSessionForUser(user: User): Promise<OptionalSessionWithToken> {
    const token = generateToken()
    const createdAt = new Date()
    const expiresAt = new Date(Date.now() + this.sessionTTL)

    const {insertedId: id} = await this.sessions.insertOne({
      token: token,
      userID: user.id,
      createdAt,
      expiresAt
    })

    return {id, user, token, createdAt, expiresAt}
  }

  async deleteSessionByToken(token: string): Promise<boolean> {
    const {deletedCount} = await this.sessions.deleteOne({token})
    return deletedCount === 1
  }

  async getSessionByToken(token: string): Promise<OptionalSessionWithToken> {
    const session = await this.sessions.findOne({token})

    if (!session) return null

    const user = await this.users.findOne({_id: session.userID}, {projection: {password: false}})

    if (!user) return null

    return {
      id: session._id,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user: {
        id: user._id,
        email: user.email
      }
    }
  }

  async deleteSessionByID(user: User, id: string): Promise<boolean> {
    const {deletedCount} = await this.sessions.deleteOne({_id: id, userID: user.id})
    return deletedCount === 1
  }

  async getSessionsForUser(user: User): Promise<Session[]> {
    const sessions = await this.sessions.find({userID: user.id}).toArray()

    return sessions.map(session => ({
      id: session._id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user: user
    }))
  }

  async getSessionByID(user: User, id: string): Promise<OptionalSession> {
    const session = await this.sessions.findOne({_id: id, userID: user.id})

    if (!session) return null

    return {
      id: session._id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user: user
    }
  }

  // Article
  // =======

  async createArticle({input}: CreateArticleArgs): Promise<Article> {
    const {shared, ...data} = input

    const {ops} = await this.articles.insertOne({
      shared,

      createdAt: new Date(),
      modifiedAt: new Date(),

      latest: {
        revision: 0,
        createdAt: new Date(),
        ...data
      },

      history: []
    })

    const {_id: id, ...article} = ops[0]

    return {id, ...article}
  }

  createArticleVersion(args: CreateArticleVersionArgs): Promise<Article> {
    throw new Error('Method not implemented.')
  }

  updateArticleVersion(args: UpdateArticleVersionArgs): Promise<Article> {
    throw new Error('Method not implemented.')
  }

  publishArticleVersion(args: PublishArticleArgs): Promise<Article> {
    throw new Error('Method not implemented.')
  }

  async getPublishedArticles({
    after,
    before,
    first,
    last
  }: GetArticlesArgs): Promise<PublishedArticleResult> {
    first = first ? Math.min(first, 100) : undefined
    last = last ? Math.min(last, 100) : undefined

    return {} as any
  }

  async getPublishedArticle(args: GetArticlesArgs): Promise<Article[]> {
    throw new Error('Method not implemented.')
  }

  async getArticles({after, before, first, last}: GetArticlesArgs): Promise<ArticlesResult> {
    after = after ? base64Decode(after) : undefined
    before = before ? base64Decode(before) : undefined

    first = first ? Math.min(first, MaxResultsPerPage) : undefined
    last = last ? Math.min(last, MaxResultsPerPage) : undefined

    if (!first && !last) throw new Error('Both `first` and `last` are undefined!')

    const sortDirection = first != undefined ? -1 : 1
    const articles = await this.articles
      .find(
        after || before
          ? {
              _id: {
                ...(after ? {$gt: after} : {}),
                ...(before ? {$lt: before} : {})
              }
            }
          : undefined
      )
      .sort({modifiedAt: sortDirection, _id: 1})
      .limit(first || last!)
      .toArray()

    const firstArticle = articles[0]
    const lastArticle = articles[articles.length - 1]

    return {
      nodes: articles.map<Article>(({_id: id, ...article}) => ({id, ...article})),
      pageInfo: {
        startCursor: firstArticle ? base64Encode(firstArticle._id) : null,
        endCursor: lastArticle ? base64Encode(lastArticle._id) : null,
        hasNextPage: true,
        hasPreviousPage: true
      },
      totalCount: 1
    }
  }

  async getArticlesByID(args: GetArticlesArgs): Promise<Article[]> {
    throw new Error('Method not implemented.')
  }

  getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]> {
    throw new Error('Method not implemented.')
  }
}

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64')
}

function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString()
}
