import {
  DBArticleAdapter,
  CreateArticleArgs,
  Article,
  UpdateArticleArgs,
  OptionalArticle,
  DeleteArticleArgs,
  PublishArticleArgs,
  UnpublishArticleArgs,
  ConnectionResult,
  GetArticlesArgs,
  LimitType,
  InputCursorType,
  SortOrder,
  ArticleSort,
  OptionalPublicArticle,
  GetPublishedArticlesArgs,
  PublicArticle
} from '@dev7ch/wepublish-api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBArticle} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'

export class MongoDBArticleAdapter implements DBArticleAdapter {
  private articles: Collection<DBArticle>
  private locale: string

  constructor(db: Db, locale: string) {
    this.articles = db.collection(CollectionName.Articles)
    this.locale = locale
  }

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

    // TODO: Escape user input with `$literal`, check other adapters aswell.
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

            'draft.properties': data.properties,

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

    const limitCount = Math.min(limit.count, MaxResultsPerPage)
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

    if (filter?.shared != undefined) {
      stateFilter['shared'] = {[filter.shared ? '$ne' : '$eq']: false}
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
      articles.map(({_id: id, shared, published: article}) => [id, {id, shared, ...article!}])
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
      nodes: nodes.map(
        article =>
          ({id: article.id, shared: article.shared, ...article.published!} as PublicArticle)
      ),
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
