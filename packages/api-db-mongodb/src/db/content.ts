import {
  DBContentAdapter,
  CreateContentArgs,
  Content,
  UpdateContentArgs,
  DeleteContentArgs,
  ConnectionResult,
  GetContentsArgs,
  LimitType,
  InputCursorType,
  SortOrder,
  ContentSort
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBContent} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'

export class MongoDBContentAdapter implements DBContentAdapter {
  private contents: Collection<DBContent>
  private locale: string

  constructor(db: Db, locale: string) {
    this.contents = db.collection(CollectionName.Content)
    this.locale = locale
  }

  async createContent({input}: CreateContentArgs): Promise<Content> {
    const {ops} = await this.contents.insertOne(input)
    return ops[0]
  }

  async updateContent({input}: UpdateContentArgs): Promise<Content> {
    const {value} = await this.contents.findOneAndUpdate(
      {id: input.id, revision: input.revision},
      [
        {
          $set: input
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) {
      throw Error(`Did not find content with id ${input.id}`)
    }
    return value
  }

  async deleteContent({id}: DeleteContentArgs): Promise<boolean> {
    const {deletedCount} = await this.contents.deleteOne({id})
    return deletedCount !== 0
  }

  async getContentByID(id: string): Promise<Content | null> {
    return this.contents.findOne({id})
  }

  async getContentsByID(ids: readonly string[]): Promise<Content[]> {
    return this.contents.find({id: {$in: ids as any}}).toArray()
  }

  // TODO: Deduplicate getImages, getPages, getAuthors
  async getContents({
    filter,
    sort,
    order,
    cursor,
    limit,
    type
  }: GetContentsArgs): Promise<ConnectionResult<any>> {
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

    const sortField = contentSortFieldForSort(sort)
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
      function cleanupUserInput(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, ' ')
      }
      textFilter = {title: {$regex: cleanupUserInput(filter.title), $options: 'i'}}
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

    let typeFilter: FilterQuery<any> = {}
    if (type) {
      typeFilter['contentType'] = {$eq: type}
    }

    // TODO: Check index usage
    const [totalCount, contents] = await Promise.all([
      this.contents.countDocuments(
        {
          $and: [typeFilter, stateFilter, metaFilters.length ? {$and: metaFilters} : {}, textFilter]
        } as any,
        {collation: {locale: this.locale, strength: 2}} as MongoCountPreferences
      ), // MongoCountPreferences doesn't include collation

      this.contents
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(typeFilter)
        .match(stateFilter)
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = contents.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? contents.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? contents.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstContent = nodes[0]
    const lastContent = nodes[nodes.length - 1]

    const startCursor = firstContent
      ? new Cursor(firstContent._id, contentDateForSort(firstContent, sort)).toString()
      : null

    const endCursor = lastContent
      ? new Cursor(lastContent._id, contentDateForSort(lastContent, sort)).toString()
      : null

    return {
      nodes,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }
}

function contentSortFieldForSort(sort: ContentSort) {
  switch (sort) {
    case ContentSort.CreatedAt:
      return 'createdAt'

    case ContentSort.ModifiedAt:
      return 'modifiedAt'

    case ContentSort.PublishedAt:
      return 'published.publishedAt'

    case ContentSort.UpdatedAt:
      return 'published.updatedAt'

    case ContentSort.PublishAt:
      return 'pending.publishAt'
  }
}

function contentDateForSort(content: DBContent, sort: ContentSort): Date | undefined {
  switch (sort) {
    case ContentSort.CreatedAt:
      return content.createdAt

    case ContentSort.ModifiedAt:
      return content.modifiedAt

    case ContentSort.PublishedAt:
      return '' as any

    case ContentSort.UpdatedAt:
      return '' as any

    case ContentSort.PublishAt:
      return '' as any
  }
}
