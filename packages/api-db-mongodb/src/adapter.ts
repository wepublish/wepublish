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
  ArticleSort,
  SortOrder,
  LimitType,
  InputCursorType,
  OptionalArticle,
  OptionalPublicArticle,
  PublicArticle,
  GetImagesArgs,
  Image,
  ImageSort,
  OptionalAuthor,
  Author,
  CreateAuthorArgs,
  UpdateAuthorArgs,
  DeleteAuthorArgs,
  DeleteArticleArgs,
  UnpublishArticleArgs,
  DeleteImageArgs,
  ConnectionResult,
  GetAuthorsArgs,
  AuthorSort,
  OptionalNavigation,
  CreateNavigationArgs,
  OptionalPublicPage,
  CreatePageArgs,
  Page,
  UpdatePageArgs,
  OptionalPage,
  DeletePageArgs,
  PublishPageArgs,
  UnpublishPageArgs,
  GetPagesArgs,
  PublicPage,
  GetPublishedPagesArgs,
  PageSort
} from '@wepublish/api'

import {Migrations, LatestMigration} from './migration'
import {generateID, generateToken, base64Encode, base64Decode, MongoErrorCode} from './utility'

import {
  DBUser,
  DBUserRole,
  DBSession,
  DBArticle,
  CollectionName,
  DBMigration,
  DBImage,
  DBAuthor,
  DBNavigation,
  DBPage
} from './schema'

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

interface MongoDBAdapterArgs extends MongoDBAdabterCommonArgs {
  readonly locale: string
  readonly client: MongoClient
  readonly db: Db

  readonly users: Collection<DBUser>
  readonly userRoles: Collection<DBUserRole>
  readonly sessions: Collection<DBSession>
  readonly navigations: Collection<DBNavigation>
  readonly authors: Collection<DBAuthor>
  readonly images: Collection<DBImage>
  readonly articles: Collection<DBArticle>
  readonly pages: Collection<DBPage>
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
  readonly userRoles: Collection<DBUserRole>
  readonly sessions: Collection<DBSession>
  readonly navigations: Collection<DBNavigation>
  readonly authors: Collection<DBAuthor>
  readonly images: Collection<DBImage>
  readonly articles: Collection<DBArticle>
  readonly pages: Collection<DBPage>

  // Init
  // ====

  private constructor({
    sessionTTL = MongoDBAdapter.DefaultSessionTTL,
    bcryptHashCostFactor = MongoDBAdapter.DefaultBcryptHashCostFactor,
    locale,
    client,
    db,
    users,
    userRoles,
    sessions,
    navigations,
    authors,
    images,
    articles,
    pages
  }: MongoDBAdapterArgs) {
    this.sessionTTL = sessionTTL
    this.bcryptHashCostFactor = bcryptHashCostFactor

    this.locale = locale
    this.client = client
    this.db = db

    this.users = users
    this.userRoles = userRoles
    this.sessions = sessions
    this.navigations = navigations
    this.authors = authors
    this.images = images
    this.articles = articles
    this.pages = pages
  }

  static createMongoClient(url: string): Promise<MongoClient> {
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
      locale,
      users: db.collection(CollectionName.Users),
      userRoles: db.collection(CollectionName.UserRoles),
      sessions: db.collection(CollectionName.Sessions),
      navigations: db.collection(CollectionName.Navigations),
      authors: db.collection(CollectionName.Authors),
      images: db.collection(CollectionName.Images),
      articles: db.collection(CollectionName.Articles),
      pages: db.collection(CollectionName.Pages)
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
    }

    return {
      migrated: {
        from: migrationState?.version,
        to: LatestMigration.version
      }
    }
  }

  // User
  // ====

  async createUser({email, name, password}: CreateUserArgs): Promise<User> {
    try {
      const passwordHash = await bcrypt.hash(password, this.bcryptHashCostFactor)
      const {insertedId: id} = await this.users.insertOne({
        createdAt: new Date(),
        modifiedAt: new Date(),
        email,
        name,
        roles: [],
        password: passwordHash
      })

      return {id, email, name}
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  async getUser(email: string): Promise<OptionalUser> {
    const user = await this.users.findOne({email})
    if (user) {
      return {id: user._id, email: user.email, name: user.name}
    } else {
      return null
    }
  }

  async getUsersByID(ids: string[]): Promise<OptionalUser[]> {
    const users = await this.users.find({_id: {$in: ids}}).toArray()

    return users.map<OptionalUser>(user => ({
      id: user._id,
      email: user.email,
      name: user.name
    }))
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {id: user._id, email: user.email, name: user.name}
    }

    return null
  }

  async getUserByID(id: string): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: id})

    if (user) {
      return {id: user._id, email: user.email, name: user.name}
    } else {
      return null
    }
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
        email: user.email,
        name: user.name
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

  // Navigation
  // ==========

  async createNavigation({input}: CreateNavigationArgs): Promise<OptionalNavigation> {
    const {ops} = await this.navigations.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      key: input.key,
      links: input.links
    })

    const {_id: id, ...navigation} = ops[0]
    return {id, ...navigation}
  }

  async getNavigationsByID(ids: readonly string[]): Promise<OptionalNavigation[]> {
    const navigations = await this.navigations.find({_id: {$in: ids}}).toArray()
    const navigationMap = Object.fromEntries(
      navigations.map(({_id: id, ...navigation}) => [id, {id, ...navigation}])
    )

    return ids.map(id => navigationMap[id] ?? null)
  }

  async getNavigationsByKey(keys: readonly string[]): Promise<OptionalNavigation[]> {
    const navigations = await this.navigations.find({key: {$in: keys as string[]}}).toArray()
    const navigationMap = Object.fromEntries(
      navigations.map(({_id: id, ...navigation}) => [navigation.key, {id, ...navigation}])
    )
    return keys.map(key => navigationMap[key] ?? null)
  }

  // Author
  // ======

  async createAuthor({input}: CreateAuthorArgs): Promise<Author> {
    const {ops} = await this.authors.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      slug: input.slug,
      imageID: input.imageID,
      links: input.links,
      bio: input.bio
    })

    const {_id: id, ...author} = ops[0]
    return {id, ...author}
  }

  async updateAuthor({id, input}: UpdateAuthorArgs): Promise<OptionalAuthor> {
    const {value} = await this.authors.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          slug: input.slug,
          imageID: input.imageID,
          links: input.links,
          bio: input.bio
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...author} = value
    return {id: outID, ...author}
  }

  async deleteAuthor({id}: DeleteAuthorArgs): Promise<string | null> {
    const {deletedCount} = await this.authors.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]> {
    const authors = await this.authors.find({_id: {$in: ids}}).toArray()
    const authorMap = Object.fromEntries(
      authors.map(({_id: id, ...author}) => [id, {id, ...author}])
    )

    return ids.map(id => authorMap[id] ?? null)
  }

  async getAuthorsBySlug(slugs: readonly string[]): Promise<OptionalAuthor[]> {
    const authors = await this.authors.find({slug: {$in: slugs as string[]}}).toArray()
    const authorMap = Object.fromEntries(
      authors.map(({_id: id, slug, ...author}) => [slug, {id, slug, ...author}])
    )

    return slugs.map(slug => authorMap[slug] ?? null)
  }

  async getAuthors({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetAuthorsArgs): Promise<ConnectionResult<Author>> {
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

    const sortField = authorSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let textFilter: FilterQuery<any> = {}

    // TODO: Rename to search
    if (filter?.name != undefined) {
      textFilter['$or'] = [{name: {$regex: filter.name, $options: 'i'}}]
    }

    const [totalCount, authors] = await Promise.all([
      this.authors.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.authors
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = authors.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? authors.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? authors.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstAuthor = nodes[0]
    const lastAuthor = nodes[nodes.length - 1]

    const startCursor = firstAuthor
      ? new Cursor(firstAuthor._id, authorDateForSort(firstAuthor, sort)).toString()
      : null

    const endCursor = lastAuthor
      ? new Cursor(lastAuthor._id, authorDateForSort(lastAuthor, sort)).toString()
      : null

    return {
      nodes: nodes.map<Author>(({_id: id, ...author}) => ({id, ...author})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }

  // Image
  // =====

  async createImage({id, input}: CreateImageArgs): Promise<OptionalImage> {
    const {ops} = await this.images.insertOne({
      _id: id,
      createdAt: new Date(),
      modifiedAt: new Date(),

      fileSize: input.fileSize,
      extension: input.extension,
      mimeType: input.mimeType,
      format: input.format,
      width: input.width,
      height: input.height,

      filename: input.filename,
      title: input.title,
      description: input.description,
      tags: input.tags,
      author: input.author,
      source: input.source,
      license: input.license,
      focalPoint: input.focalPoint
    })

    const {_id: outID, ...image} = ops[0]
    return {id: outID, ...image}
  }

  async updateImage({id, input}: UpdateImageArgs): Promise<OptionalImage> {
    const {value} = await this.images.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            modifiedAt: new Date(),
            filename: input.filename,
            title: input.title,
            description: input.description,
            tags: input.tags,
            author: input.author,
            source: input.source,
            license: input.license,
            focalPoint: input.focalPoint
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...image} = value
    return {id: outID, ...image}
  }

  async deleteImage({id}: DeleteImageArgs): Promise<boolean | null> {
    const {deletedCount} = await this.images.deleteOne({_id: id})
    return deletedCount !== 0 ? true : null
  }

  async getImagesByID(ids: readonly string[]): Promise<OptionalImage[]> {
    const images = await this.images.find({_id: {$in: ids}}).toArray()
    const imageMap = Object.fromEntries(
      images.map(({_id: id, ...article}) => [id, {id, ...article}])
    )

    return ids.map(id => imageMap[id] ?? null)
  }

  async getImages({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetImagesArgs): Promise<ConnectionResult<Image>> {
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

    const sortField = imageSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let textFilter: FilterQuery<any> = {}
    let metaFilters: FilterQuery<any> = []

    // TODO: Rename to search
    if (filter?.title != undefined) {
      textFilter['$or'] = [
        {title: {$regex: filter.title, $options: 'i'}},
        {filename: {$regex: filter.title, $options: 'i'}}
      ]
    }

    if (filter?.tags) {
      metaFilters.push({tags: {$in: filter.tags}})
    }
    const [totalCount, images] = await Promise.all([
      this.images.countDocuments(
        {$and: [metaFilters.length ? {$and: metaFilters} : {}, textFilter]} as any,
        {collation: {locale: this.locale, strength: 2}} as MongoCountPreferences
      ), // MongoCountPreferences doesn't include collation

      this.images
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = images.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? images.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? images.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstImage = nodes[0]
    const lastImage = nodes[nodes.length - 1]

    const startCursor = firstImage
      ? new Cursor(firstImage._id, imageDateForSort(firstImage, sort)).toString()
      : null

    const endCursor = lastImage
      ? new Cursor(lastImage._id, imageDateForSort(lastImage, sort)).toString()
      : null

    return {
      nodes: nodes.map<Image>(({_id: id, ...image}) => ({id, ...image})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
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
              $ifNull: ['$draft.createdAt', new Date()]
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

  async deleteArticle({id}: DeleteArticleArgs): Promise<boolean | null> {
    const {deletedCount} = await this.articles.deleteOne({_id: id})
    return deletedCount !== 0 ? true : null
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
              modifiedAt: new Date(),
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

  async unpublishArticle({id}: UnpublishArticleArgs): Promise<OptionalArticle> {
    const {value} = await this.articles.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            draft: {
              $ifNull: ['$draft', {$ifNull: ['$pending', '$published']}]
            },
            pending: null,
            published: null
          }
        },
        {
          $unset: ['draft.publishAt', 'draft.publishedAt', 'draft.updatedAt']
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...article} = value
    return {id: outID, ...article}
  }

  async getArticlesByID(ids: readonly string[]): Promise<OptionalArticle[]> {
    await this.updatePendingArticles()

    const articles = await this.articles.find({_id: {$in: ids}}).toArray()
    const articleMap = Object.fromEntries(
      articles.map(({_id: id, ...article}) => [id, {id, ...article}])
    )

    return ids.map(id => articleMap[id] ?? null)
  }

  // TODO: Deduplicate getImages, getPages, getAuthors
  async getArticles({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetArticlesArgs): Promise<ConnectionResult<Article>> {
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

    const sortField = articleSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let stateFilter: FilterQuery<any> = {}
    let textFilter: FilterQuery<any> = {}

    let metaFilters: FilterQuery<any> = []

    if (filter?.title != undefined) {
      // TODO: Only match based on state filter
      textFilter['$or'] = [
        {'draft.title': {$regex: filter.title, $options: 'i'}},
        {'pending.title': {$regex: filter.title, $options: 'i'}},
        {'published.title': {$regex: filter.title, $options: 'i'}}
      ]
    }

    if (filter?.published != undefined) {
      stateFilter['published'] = {[filter.published ? '$ne' : '$eq']: null}
    }

    if (filter?.draft != undefined) {
      stateFilter['draft'] = {[filter.draft ? '$ne' : '$eq']: null}
    }

    if (filter?.pending != undefined) {
      stateFilter['pending'] = {[filter.pending ? '$ne' : '$eq']: null}
    }

    if (filter?.tags) {
      // TODO: Only match based on state filter
      metaFilters.push({
        $or: [
          {'draft.tags': {$in: filter.tags}},
          {'pending.tags': {$in: filter.tags}},
          {'published.tags': {$in: filter.tags}}
        ]
      })
    }

    if (filter?.authors) {
      // TODO: Only match based on state filter
      metaFilters.push({
        $or: [
          {'draft.authorIDs': {$in: filter.authors}},
          {'pending.authorIDs': {$in: filter.authors}},
          {'published.authorIDs': {$in: filter.authors}}
        ]
      })
    }

    // TODO: Check index usage
    const [totalCount, articles] = await Promise.all([
      this.articles.countDocuments(
        {$and: [stateFilter, metaFilters.length ? {$and: metaFilters} : {}, textFilter]} as any,
        {collation: {locale: this.locale, strength: 2}} as MongoCountPreferences
      ), // MongoCountPreferences doesn't include collation

      this.articles
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(stateFilter)
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(textFilter)
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

  async getPublishedArticlesByID(ids: readonly string[]): Promise<OptionalPublicArticle[]> {
    await this.updatePendingArticles()

    const articles = await this.articles.find({_id: {$in: ids}, published: {$ne: null}}).toArray()
    const articleMap = Object.fromEntries(
      articles.map(({_id: id, published: article}) => [id, {id, ...article!}])
    )

    return ids.map(id => (articleMap[id] as PublicArticle) ?? null)
  }

  async getPublishedArticles({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetPublishedArticlesArgs): Promise<ConnectionResult<PublicArticle>> {
    const {nodes, pageInfo, totalCount} = await this.getArticles({
      filter: {...filter, published: true},
      sort,
      order,
      cursor,
      limit
    })

    return {
      nodes: nodes.map(article => ({id: article.id, ...article.published!} as PublicArticle)),
      pageInfo,
      totalCount
    }
  }

  // TODO: Throttle or cron this function
  async updatePendingArticles(): Promise<void> {
    await this.articles.updateMany({'pending.publishAt': {$lte: new Date()}}, [
      {
        $set: {
          modifiedAt: new Date(),
          published: '$pending',
          pending: null
        }
      }
    ] as any)
  }

  // Page
  // ====

  async createPage({input}: CreatePageArgs): Promise<Page> {
    const {...data} = input
    const {ops} = await this.pages.insertOne({
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

    const {_id: id, ...page} = ops[0]

    return {id, ...page}
  }

  async updatePage({id, input}: UpdatePageArgs): Promise<OptionalPage> {
    const {...data} = input
    const {value} = await this.pages.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
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
              $ifNull: ['$draft.createdAt', new Date()]
            },

            'draft.slug': data.slug,

            'draft.title': data.title,
            'draft.description': data.description,

            'draft.imageID': data.imageID,
            'draft.tags': data.tags,

            'draft.blocks': data.blocks
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...page} = value
    return {id: outID, ...page}
  }

  async deletePage({id}: DeletePageArgs): Promise<boolean | null> {
    const {deletedCount} = await this.pages.deleteOne({_id: id})
    return deletedCount !== 0 ? true : null
  }

  async publishPage({
    id,
    publishAt,
    publishedAt,
    updatedAt
  }: PublishPageArgs): Promise<OptionalPage> {
    publishAt = publishAt ?? new Date()

    if (publishAt > new Date()) {
      const {value} = await this.pages.findOneAndUpdate(
        {_id: id},
        [
          {
            $set: {
              modifiedAt: new Date(),
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

      const {_id: outID, ...page} = value
      return {id: outID, ...page}
    } else {
      const {value} = await this.pages.findOneAndUpdate(
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

      const {_id: outID, ...page} = value
      return {id: outID, ...page}
    }
  }

  async unpublishPage({id}: UnpublishPageArgs): Promise<OptionalPage> {
    const {value} = await this.pages.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            draft: {
              $ifNull: ['$draft', {$ifNull: ['$pending', '$published']}]
            },
            pending: null,
            published: null
          }
        },
        {
          $unset: ['draft.publishAt', 'draft.publishedAt', 'draft.updatedAt']
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...page} = value
    return {id: outID, ...page}
  }

  async getPagesByID(ids: readonly string[]): Promise<OptionalPage[]> {
    await this.updatePendingPages()

    const pages = await this.pages.find({_id: {$in: ids}}).toArray()
    const pageMap = Object.fromEntries(pages.map(({_id: id, ...page}) => [id, {id, ...page}]))

    return ids.map(id => pageMap[id] ?? null)
  }

  async getPages({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetPagesArgs): Promise<ConnectionResult<Page>> {
    await this.updatePendingPages()

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

    const sortField = pageSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let stateFilter: FilterQuery<any> = {}
    let textFilter: FilterQuery<any> = {}

    let metaFilters: FilterQuery<any> = []

    if (filter?.title != undefined) {
      // TODO: Only match based on state filter
      textFilter['$or'] = [
        {'draft.title': {$regex: filter.title, $options: 'i'}},
        {'pending.title': {$regex: filter.title, $options: 'i'}},
        {'published.title': {$regex: filter.title, $options: 'i'}}
      ]
    }

    if (filter?.published != undefined) {
      stateFilter['published'] = {[filter.published ? '$ne' : '$eq']: null}
    }

    if (filter?.draft != undefined) {
      stateFilter['draft'] = {[filter.draft ? '$ne' : '$eq']: null}
    }

    if (filter?.pending != undefined) {
      stateFilter['pending'] = {[filter.pending ? '$ne' : '$eq']: null}
    }

    if (filter?.tags) {
      // TODO: Only match based on state filter
      metaFilters.push({
        $or: [
          {'draft.tags': {$in: filter.tags}},
          {'pending.tags': {$in: filter.tags}},
          {'published.tags': {$in: filter.tags}}
        ]
      })
    }

    // TODO: Check index usage
    const [totalCount, pages] = await Promise.all([
      this.pages.countDocuments(
        {$and: [stateFilter, metaFilters.length ? {$and: metaFilters} : {}, textFilter]} as any,
        {collation: {locale: this.locale, strength: 2}} as MongoCountPreferences
      ), // MongoCountPreferences doesn't include collation

      this.pages
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(stateFilter)
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = pages.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? pages.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? pages.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstPage = nodes[0]
    const lastPage = nodes[nodes.length - 1]

    const startCursor = firstPage
      ? new Cursor(firstPage._id, pageDateForSort(firstPage, sort)).toString()
      : null

    const endCursor = lastPage
      ? new Cursor(lastPage._id, pageDateForSort(lastPage, sort)).toString()
      : null

    return {
      nodes: nodes.map<Page>(({_id: id, ...page}) => ({id, ...page})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }

  async getPublishedPagesByID(ids: readonly string[]): Promise<OptionalPublicPage[]> {
    await this.updatePendingPages()

    const pages = await this.pages.find({_id: {$in: ids}, published: {$ne: null}}).toArray()
    const pageMap = Object.fromEntries(
      pages.map(({_id: id, published: page}) => [id, {id, ...page!}])
    )

    return ids.map(id => (pageMap[id] as PublicPage) ?? null)
  }

  async getPublishedPagesBySlug(slugs: readonly string[]): Promise<OptionalPublicPage[]> {
    await this.updatePendingPages()

    const pages = await this.pages
      .find({published: {$ne: null}, 'published.slug': {$in: slugs}})
      .toArray()

    const pageMap = Object.fromEntries(
      pages.map(({_id: id, published: page}) => [page!.slug, {id, ...page!}])
    )

    return slugs.map(slug => (pageMap[slug] as PublicPage) ?? null)
  }

  async getPublishedPages({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetPublishedPagesArgs): Promise<ConnectionResult<PublicPage>> {
    const {nodes, pageInfo, totalCount} = await this.getPages({
      filter: {...filter, published: true},
      sort,
      order,
      cursor,
      limit
    })

    return {
      nodes: nodes.map(page => ({id: page.id, ...page.published!} as PublicPage)),
      pageInfo,
      totalCount
    }
  }

  // TODO: Throttle or cron this function
  async updatePendingPages(): Promise<void> {
    await this.pages.updateMany({'pending.publishAt': {$lte: new Date()}}, [
      {
        $set: {
          modifiedAt: new Date(),
          published: '$pending',
          pending: null
        }
      }
    ] as any)
  }
}

function authorSortFieldForSort(sort: AuthorSort) {
  switch (sort) {
    case AuthorSort.CreatedAt:
      return 'createdAt'

    case AuthorSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function authorDateForSort(author: DBAuthor, sort: AuthorSort): Date {
  switch (sort) {
    case AuthorSort.CreatedAt:
      return author.createdAt

    case AuthorSort.ModifiedAt:
      return author.modifiedAt
  }
}

function imageSortFieldForSort(sort: ImageSort) {
  switch (sort) {
    case ImageSort.CreatedAt:
      return 'createdAt'

    case ImageSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function imageDateForSort(image: DBImage, sort: ImageSort): Date {
  switch (sort) {
    case ImageSort.CreatedAt:
      return image.createdAt

    case ImageSort.ModifiedAt:
      return image.modifiedAt
  }
}

function articleSortFieldForSort(sort: ArticleSort) {
  switch (sort) {
    case ArticleSort.CreatedAt:
      return 'createdAt'

    case ArticleSort.ModifiedAt:
      return 'modifiedAt'

    case ArticleSort.PublishedAt:
      return 'published.publishedAt'

    case ArticleSort.UpdatedAt:
      return 'published.updatedAt'

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

function pageSortFieldForSort(sort: PageSort) {
  switch (sort) {
    case PageSort.CreatedAt:
      return 'createdAt'

    case PageSort.ModifiedAt:
      return 'modifiedAt'

    case PageSort.PublishedAt:
      return 'published.publishedAt'

    case PageSort.UpdatedAt:
      return 'published.updatedAt'

    case PageSort.PublishAt:
      return 'pending.publishAt'
  }
}

function pageDateForSort(page: DBPage, sort: PageSort): Date | undefined {
  switch (sort) {
    case PageSort.CreatedAt:
      return page.createdAt

    case PageSort.ModifiedAt:
      return page.modifiedAt

    case PageSort.PublishedAt:
      return page.published?.publishedAt

    case PageSort.UpdatedAt:
      return page.published?.updatedAt

    case PageSort.PublishAt:
      return page.pending?.publishAt
  }
}
