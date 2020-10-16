import {
  DBAuthorAdapter,
  CreateAuthorArgs,
  Author,
  UpdateAuthorArgs,
  OptionalAuthor,
  DeleteAuthorArgs,
  ConnectionResult,
  GetAuthorsArgs,
  InputCursorType,
  SortOrder,
  LimitType,
  AuthorSort
} from '@dev7ch/wepublish-api'

import {Collection, Db, MongoCountPreferences, FilterQuery} from 'mongodb'

import {CollectionName, DBAuthor} from './schema'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'

export class MongoDBAuthorAdapter implements DBAuthorAdapter {
  private authors: Collection<DBAuthor>
  private locale: string

  constructor(db: Db, locale: string) {
    this.authors = db.collection(CollectionName.Authors)
    this.locale = locale
  }

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
