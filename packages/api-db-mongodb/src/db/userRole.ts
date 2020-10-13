import {
  DBUserRoleAdapter,
  CreateUserRoleArgs,
  OptionalUserRole,
  UserRole,
  SortOrder,
  UpdateUserRoleArgs,
  DeleteUserRoleArgs,
  GetUserRolesArgs,
  ConnectionResult,
  LimitType,
  InputCursorType,
  UserRoleSort
} from '../../../api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBUserRole} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'
import {isNonNull} from '../utility'

export class MongoDBUserRoleAdapter implements DBUserRoleAdapter {
  private userRoles: Collection<DBUserRole>
  private locale: string

  constructor(db: Db, locale: string) {
    this.userRoles = db.collection(CollectionName.UserRoles)
    this.locale = locale
  }

  async createUserRole({input}: CreateUserRoleArgs): Promise<OptionalUserRole> {
    const {insertedId: id} = await this.userRoles.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      description: input.description || '',
      systemRole: false, //always False because only the system can create system roles
      permissionIDs: input.permissionIDs // Test if they exist
    })

    const userRole = await this.userRoles.findOne({_id: id})
    if (!userRole) {
      throw new Error('Could not create UserRole')
    }
    return {
      id: userRole._id,
      name: userRole.name,
      description: userRole.description,
      systemRole: userRole.systemRole,
      permissionIDs: userRole.permissionIDs
    }
  }

  async updateUserRole({id, input}: UpdateUserRoleArgs): Promise<OptionalUserRole> {
    const userRole = await this.getUserRoleByID(id)
    if (userRole?.systemRole) {
      throw new Error('Can not change SystemRoles')
    }
    const {value} = await this.userRoles.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          description: input.description,
          permissionIDs: input.permissionIDs
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserRoleByID(outID)
  }

  async deleteUserRole({id}: DeleteUserRoleArgs): Promise<string | null> {
    const userRole = await this.getUserRoleByID(id)
    if (userRole?.systemRole) {
      throw new Error('Can not delete SystemRoles')
    }
    const {deletedCount} = await this.userRoles.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getUserRole(name: string): Promise<OptionalUserRole> {
    const userRole = await this.userRoles.findOne({name})
    if (userRole) {
      return {
        id: userRole._id,
        name: userRole.name,
        description: userRole.description,
        systemRole: userRole.systemRole,
        permissionIDs: userRole.permissionIDs
      }
    } else {
      return null
    }
  }

  async getUserRoleByID(id: string): Promise<OptionalUserRole> {
    const userRole = await this.userRoles.findOne({_id: id})
    if (userRole) {
      return {
        id: userRole._id,
        name: userRole.name,
        description: userRole.description,
        systemRole: userRole.systemRole,
        permissionIDs: userRole.permissionIDs
      }
    } else {
      return null
    }
  }

  async getUserRolesByID(ids: string[]): Promise<OptionalUserRole[]> {
    const userRoles = await this.userRoles.find({_id: {$in: ids}}).toArray()

    return userRoles.map<OptionalUserRole>(userRole => ({
      id: userRole._id,
      name: userRole.name,
      description: userRole.description,
      systemRole: userRole.systemRole,
      permissionIDs: userRole.permissionIDs
    }))
  }

  async getNonOptionalUserRolesByID(ids: string[]): Promise<UserRole[]> {
    const roles = await this.getUserRolesByID(ids)
    return roles ? roles.filter(isNonNull) : []
  }

  async getUserRoles({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetUserRolesArgs): Promise<ConnectionResult<UserRole>> {
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

    const sortField = userRoleSortFieldForSort(sort)
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

    const [totalCount, userRoles] = await Promise.all([
      this.userRoles.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.userRoles
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = userRoles.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? userRoles.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? userRoles.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstUserRole = nodes[0]
    const lastUserRole = nodes[nodes.length - 1]

    const startCursor = firstUserRole
      ? new Cursor(firstUserRole._id, userRoleDateForSort(firstUserRole, sort)).toString()
      : null

    const endCursor = lastUserRole
      ? new Cursor(lastUserRole._id, userRoleDateForSort(lastUserRole, sort)).toString()
      : null

    return {
      nodes: nodes.map<UserRole>(({_id: id, ...userRole}) => ({id, ...userRole})),

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

function userRoleSortFieldForSort(sort: UserRoleSort) {
  switch (sort) {
    case UserRoleSort.CreatedAt:
      return 'createdAt'

    case UserRoleSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function userRoleDateForSort(userRole: DBUserRole, sort: UserRoleSort): Date {
  switch (sort) {
    case UserRoleSort.CreatedAt:
      return userRole.createdAt

    case UserRoleSort.ModifiedAt:
      return userRole.modifiedAt
  }
}
