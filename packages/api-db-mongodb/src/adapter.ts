import bcrypt from 'bcrypt'

import {MongoClient, Db, Collection, MongoError, FilterQuery, MongoCountPreferences} from 'mongodb'

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
  UpdateArticleArgs,
  PublishArticleArgs,
  GetArticlesArgs,
  GetPublishedArticlesArgs,
  ArticlesResult,
  PublishedArticleResult,
  ArticleHistory,
  ArticleSort,
  SortOrder,
  LimitType,
  InputCursorType,
  OptionalArticle,
  OptionalPublishedArticle,
  PublishedArticle
} from '@wepublish/api'

import {Migrations, LatestMigration} from './migration'
import {generateID, generateToken, base64Encode, base64Decode, MongoErrorCode} from './utility'

import {OptionalAuthor} from '@wepublish/api/lib/db/author'
import {DBUser, DBSession, DBArticle, CollectionName, DBMigration} from './schema'

export interface MongoDBAdabterSharedArgs {
  readonly sessionTTL?: number
  readonly bcryptHashCostFactor?: number
}

export interface MongoDBAdapterConnectArgs extends MongoDBAdabterSharedArgs {
  readonly url: string
  readonly database: string
  readonly locale: string
}

export interface MongoDBAdapterInitializeArgs extends MongoDBAdabterSharedArgs {
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

export class PKFactory {
  createPk() {
    return generateID()
  }
}

export class Cursor {
  static Delimiter = '|'

  readonly id: string
  readonly date?: Date

  constructor(id: string, date?: Date) {
    this.id = id
    this.date = date
  }

  toString() {
    const components = []

    components.push(this.id)
    if (this.date) components.push(this.date.getTime())

    return base64Encode(components.join(Cursor.Delimiter))
  }

  static from(encodedStr: string) {
    const str = base64Decode(encodedStr)
    const [id, dateStr] = str.split(Cursor.Delimiter)

    return new Cursor(id, dateStr ? new Date(parseInt(dateStr)) : undefined)
  }
}

interface MongoDBAdapterArgs extends MongoDBAdabterSharedArgs {
  readonly locale: string
  readonly client: MongoClient
  readonly db: Db
  readonly users: Collection<DBUser>
  readonly sessions: Collection<DBSession>
  readonly articles: Collection<DBArticle>
}

export class MongoDBAdapter implements DBAdapter {
  static DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7 // 1w
  static DefaultBcryptHashCostFactor = 11
  static MaxResultsPerPage = 100

  readonly sessionTTL: number
  readonly bcryptHashCostFactor: number

  readonly locale: string
  readonly client: MongoClient
  readonly db: Db

  readonly users: Collection<DBUser>
  readonly sessions: Collection<DBSession>
  readonly articles: Collection<DBArticle>

  private constructor({
    sessionTTL = MongoDBAdapter.DefaultSessionTTL,
    bcryptHashCostFactor = MongoDBAdapter.DefaultBcryptHashCostFactor,
    locale,
    client,
    db,
    users,
    sessions,
    articles
  }: MongoDBAdapterArgs) {
    this.sessionTTL = sessionTTL
    this.bcryptHashCostFactor = bcryptHashCostFactor

    this.locale = locale
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
    sessionTTL = MongoDBAdapter.DefaultSessionTTL,
    bcryptHashCostFactor = MongoDBAdapter.DefaultBcryptHashCostFactor,
    url,
    database,
    locale
  }: MongoDBAdapterConnectArgs) {
    const client = await this.createMongoClient(url)
    const db = client.db(database)

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
      locale,
      users: db.collection(CollectionName.Users),
      sessions: db.collection(CollectionName.Sessions),
      articles: db.collection(CollectionName.Articles)
    })
  }

  static async getDBMigrationState(db: Db): Promise<DBMigration | null> {
    const result = await db
      .collection<DBMigration>(CollectionName.Migrations)
      .findOne({}, {sort: {createdAt: SortOrder.Descending}})

    return result
  }

  static async initialize({
    sessionTTL = MongoDBAdapter.DefaultSessionTTL,
    bcryptHashCostFactor = MongoDBAdapter.DefaultBcryptHashCostFactor,
    url,
    database,
    locale,
    seed
  }: MongoDBAdapterInitializeArgs): Promise<InitializationResult> {
    const client = await this.createMongoClient(url)
    const db = client.db(database)

    const migrationState = await this.getDBMigrationState(db)

    if (migrationState?.version === LatestMigration.version) {
      return {}
    }

    const index = Migrations.findIndex(migration => migration.version === migrationState?.version)
    const remainingMigrations = Migrations.slice(index + 1)

    for (const migration of remainingMigrations) {
      await migration.migrate(db, locale)

      db.collection<DBMigration>(CollectionName.Migrations).insertOne({
        version: migration.version,
        createdAt: new Date()
      })
    }

    if (!migrationState) {
      const adapter = await this.connect({sessionTTL, bcryptHashCostFactor, url, database, locale})
      await seed?.(adapter)
    }

    return {
      migrated: {
        from: migrationState?.version,
        to: LatestMigration.version
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

      draft: {
        revision: 0,
        createdAt: new Date(),
        ...data
      },

      pending: null,
      published: null
    })

    const {_id: id, ...article} = ops[0]

    return {id, ...article}
  }

  async updateArticle({id, input}: UpdateArticleArgs): Promise<OptionalArticle> {
    const {shared, ...data} = input
    const {value} = await this.articles.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            shared,
            modifiedAt: new Date(),

            'draft.revision': {
              $ifNull: [
                '$draft.revision',
                {
                  $cond: [
                    {$ne: ['$pending', null]},
                    {$add: ['$pending.revision', 1]},
                    {
                      $cond: [{$ne: ['$published', null]}, {$add: ['$published.revision', 1]}, 0]
                    }
                  ]
                }
              ]
            },

            'draft.createdAt': {
              $cond: [{$ne: ['$draft', null]}, '$draft.createdAt', new Date()]
            },

            'draft.title': data.title,
            'draft.preTitle': data.preTitle,
            'draft.lead': data.lead,

            'draft.slug': data.slug,
            'draft.imageID': data.imageID,
            'draft.authorIDs': data.authorIDs,
            'draft.tags': data.tags,
            'draft.breaking': data.breaking,

            'draft.blocks': data.blocks
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...article} = value
    return {id: outID, ...article}
  }

  async publishArticle({
    id,
    publishAt,
    publishedAt,
    updatedAt
  }: PublishArticleArgs): Promise<OptionalArticle> {
    publishAt = publishAt ?? new Date()

    if (publishAt > new Date()) {
      const {value} = await this.articles.findOneAndUpdate(
        {_id: id},
        [
          {
            $set: {
              pending: {
                $cond: [
                  {$ne: ['$draft', null]},
                  '$draft',
                  {
                    $cond: [
                      {$ne: ['$pending', null]},
                      '$pending',
                      {$cond: [{$ne: ['$published', null]}, '$published', null]}
                    ]
                  }
                ]
              },
              draft: null
            }
          },
          {
            $set: {
              'pending.publishAt': publishAt,
              'pending.publishedAt': publishedAt ?? {
                $cond: [{$ne: ['$published', null]}, '$published.publishedAt', publishAt]
              },

              'pending.updatedAt': updatedAt ?? publishAt
            }
          }
        ] as any,
        {returnOriginal: false}
      )

      if (!value) return null

      const {_id: outID, ...article} = value
      return {id: outID, ...article}
    } else {
      const {value} = await this.articles.findOneAndUpdate(
        {_id: id},
        [
          {
            $set: {
              tempPublishedAt: '$published.publishedAt'
            }
          },
          {
            $set: {
              published: {
                $ifNull: ['$draft', {$ifNull: ['$pending', '$published']}]
              },
              pending: null,
              draft: null
            }
          },
          {
            $set: {
              'published.publishedAt': publishedAt ?? {
                $ifNull: ['$tempPublishedAt', publishAt]
              },

              'published.updatedAt': updatedAt ?? publishAt
            }
          },
          {
            $unset: ['tempPublishedAt', 'published.publishAt']
          }
        ] as any,
        {returnOriginal: false}
      )

      if (!value) return null

      const {_id: outID, ...article} = value
      return {id: outID, ...article}
    }
  }

  async getArticlesByID(ids: readonly string[]): Promise<OptionalArticle[]> {
    await this.updatePendingArticles()

    const articles = await this.articles.find({_id: {$in: ids}}).toArray()
    const articleMap = Object.fromEntries(
      articles.map(({_id: id, ...article}) => [id, {id, ...article}])
    )

    return ids.map(id => articleMap[id] ?? null)
  }

  async getPublishedArticlesByID(ids: readonly string[]): Promise<OptionalPublishedArticle[]> {
    await this.updatePendingArticles()

    const articles = await this.articles.find({_id: {$in: ids}, published: {$ne: null}}).toArray()
    const articleMap = Object.fromEntries(
      articles.map(({_id: id, published: article}) => [id, {id, ...article!}])
    )

    return ids.map(id => (articleMap[id] as PublishedArticle) ?? null)
  }

  async getPublishedArticles({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetPublishedArticlesArgs): Promise<PublishedArticleResult> {
    await this.updatePendingArticles()

    const {nodes, pageInfo, totalCount} = await this.getArticles({
      filter: {...filter, published: true},
      sort,
      order,
      cursor,
      limit
    })

    return {
      nodes: nodes.map(article => ({id: article.id, ...article.published!} as PublishedArticle)),
      pageInfo,
      totalCount
    }
  }

  async getArticles({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetArticlesArgs): Promise<ArticlesResult> {
    await this.updatePendingArticles()

    const limitCount = Math.min(limit.count, MongoDBAdapter.MaxResultsPerPage)
    const sortDirection = limit.type === LimitType.First ? order : -order

    const cursorData = cursor.type !== InputCursorType.None ? Cursor.from(cursor.data) : undefined

    const expr =
      order === SortOrder.Ascending
        ? cursor.type === InputCursorType.After
          ? '$gt'
          : '$lt'
        : cursor.type === InputCursorType.After
        ? '$lt'
        : '$gt'

    const sortField = sortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let documentFilter: FilterQuery<any> = {}

    // TODO: Title Filter

    if (filter?.published != undefined) {
      documentFilter['published'] = {[filter.published ? '$ne' : '$eq']: null}
    }

    if (filter?.draft != undefined) {
      documentFilter['draft'] = {[filter.draft ? '$ne' : '$eq']: null}
    }

    if (filter?.pending != undefined) {
      documentFilter['pending'] = {[filter.pending ? '$ne' : '$eq']: null}
    }

    if (filter?.tags) documentFilter['draft.tags'] = {$in: filter.tags}
    if (filter?.authors) documentFilter['draft.authors'] = {$in: filter.authors}

    const [totalCount, articles] = await Promise.all([
      this.articles.countDocuments(documentFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.articles
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(documentFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = articles.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? articles.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? articles.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstArticle = nodes[0]
    const lastArticle = nodes[nodes.length - 1]

    const startCursor = firstArticle
      ? new Cursor(firstArticle._id, articleDateForSort(firstArticle, sort)).toString()
      : null

    const endCursor = lastArticle
      ? new Cursor(lastArticle._id, articleDateForSort(lastArticle, sort)).toString()
      : null

    return {
      nodes: nodes.map<Article>(({_id: id, ...article}) => ({id, ...article})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }

  async getArticleHistory(): Promise<ArticleHistory> {
    await this.updatePendingArticles()
    throw new Error('Method not implemented.')
  }

  async getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]> {
    throw new Error('Method not implemented.')
  }

  async updatePendingArticles(): Promise<void> {
    // TODO
  }
}

function sortFieldForSort(sort: ArticleSort) {
  switch (sort) {
    case ArticleSort.CreatedAt:
      return 'createdAt'

    case ArticleSort.ModifiedAt:
      return 'modifiedAt'

    case ArticleSort.PublishedAt:
      return 'published.publishedAt'

    case ArticleSort.UpdatedAt:
      return 'published.publishedAt'

    case ArticleSort.PublishAt:
      return 'pending.publishAt'
  }
}

function articleDateForSort(article: DBArticle, sort: ArticleSort): Date | undefined {
  switch (sort) {
    case ArticleSort.CreatedAt:
      return article.createdAt

    case ArticleSort.ModifiedAt:
      return article.modifiedAt

    case ArticleSort.PublishedAt:
      return article.published?.publishedAt

    case ArticleSort.UpdatedAt:
      return article.published?.updatedAt

    case ArticleSort.PublishAt:
      return article.pending?.publishAt
  }
}
