import {
  DBOrganisationAdapter,
  Organisation,
  CreateOrganisationArgs,
  GetOrganisationArgs,
  ConnectionResult,
  InputCursorType,
  SortOrder,
  LimitType,
  OrganisationSort,
} from '@wepublish/api'

import {Collection, Db, MongoCountPreferences, FilterQuery} from 'mongodb'

import {CollectionName, DBOrganisation} from './schema'
import {Cursor} from './cursor'
import {MaxResultsPerPage} from './defaults'
import {escapeRegExp} from '../utility'


export class MongoDBOrganisationAdapter implements DBOrganisationAdapter {
  private organisation: Collection<DBOrganisation>
  private locale: string

  constructor(db: Db, locale: string) {
    this.organisation = db.collection(CollectionName.Organisation)
    this.locale = locale
  }

  async createOrganisation({input}: CreateOrganisationArgs): Promise<Organisation> {
    const {ops} = await this.organisation.insertOne({
      name: input.name,
      location: input.location,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    const {_id: id, ...organisation} = ops[0]
    return { id, ...organisation}
  }

  async getOrganisations({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetOrganisationArgs): Promise<ConnectionResult<Organisation>> {
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

    const sortField = organiationSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    const textFilter: FilterQuery<any> = {}

    // TODO: Rename to search
    if (filter?.name != undefined) {
      textFilter['$or'] = [{name: {$regex: escapeRegExp(filter.name), $options: 'i'}}]
    }

    const [totalCount, authors] = await Promise.all([
      this.organisation.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.organisation
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .skip(limit.skip ?? 0)
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
      ? new Cursor(firstAuthor._id, organisationDateForSort(firstAuthor, sort)).toString()
      : null

    const endCursor = lastAuthor
      ? new Cursor(lastAuthor._id, organisationDateForSort(lastAuthor, sort)).toString()
      : null

    return {
      nodes: nodes.map<Organisation>(({_id: id, ...author}) => ({id, ...author})),

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

function organiationSortFieldForSort(sort: OrganisationSort) {
  switch (sort) {
    case OrganisationSort.CreatedAt:
      return 'createdAt'
    case OrganisationSort.ModifiedAt:
      return 'modifiedAt'
    case OrganisationSort.Name:
      return 'name'
    case OrganisationSort.Location:
      return 'location'
  }
}

function organisationDateForSort(organisation: DBOrganisation, sort: OrganisationSort): Date {
  switch (sort) {
    case OrganisationSort.CreatedAt:
      return organisation.createdAt
    case OrganisationSort.ModifiedAt:
      return organisation.modifiedAt
    case OrganisationSort.Name:
      return organisation.createdAt
    case OrganisationSort.Location:
      return organisation.createdAt
  }
}
