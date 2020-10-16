import {
  CreatePageArgs,
  Page,
  UpdatePageArgs,
  OptionalPage,
  DeletePageArgs,
  PublishPageArgs,
  UnpublishPageArgs,
  LimitType,
  InputCursorType,
  ConnectionResult,
  GetPagesArgs,
  SortOrder,
  PageSort,
  PublicPage,
  GetPublishedPagesArgs,
  OptionalPublicPage,
  DBPageAdapter
} from '@dev7ch/wepublish-api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBPage} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'

export class MongoDBPageAdapter implements DBPageAdapter {
  private pages: Collection<DBPage>
  private locale: string

  constructor(db: Db, locale: string) {
    this.pages = db.collection(CollectionName.Pages)
    this.locale = locale
  }

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

            'draft.properties': data.properties,

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
