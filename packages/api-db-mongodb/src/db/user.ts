import bcrypt from 'bcrypt'

import {
  DBUserAdapter,
  CreateUserArgs,
  User,
  OptionalUser,
  GetUserForCredentialsArgs,
  SortOrder,
  UpdateUserArgs,
  DeleteUserArgs,
  ResetUserPasswordArgs,
  GetUsersArgs,
  ConnectionResult,
  LimitType,
  InputCursorType,
  UserSort
} from '../../../api'

import {Collection, Db, FilterQuery, MongoCountPreferences, MongoError} from 'mongodb'

import {DBUser, CollectionName} from './schema'
import {MongoErrorCode} from '../utility'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'

export class MongoDBUserAdapter implements DBUserAdapter {
  private users: Collection<DBUser>
  private bcryptHashCostFactor: number
  private locale: string

  constructor(db: Db, bcryptHashCostFactor: number, locale: string) {
    this.users = db.collection(CollectionName.Users)
    this.bcryptHashCostFactor = bcryptHashCostFactor
    this.locale = locale
  }

  async createUser({input, password}: CreateUserArgs): Promise<OptionalUser> {
    try {
      const passwordHash = await bcrypt.hash(password, this.bcryptHashCostFactor)
      const {insertedId: id} = await this.users.insertOne({
        createdAt: new Date(),
        modifiedAt: new Date(),
        email: input.email,
        name: input.name,
        roleIDs: input.roleIDs,
        password: passwordHash
      })

      return this.getUserByID(id)
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
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        roleIDs: user.roleIDs
      }
    } else {
      return null
    }
  }

  async updateUser({id, input}: UpdateUserArgs): Promise<OptionalUser> {
    const {value} = await this.users.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          email: input.email,
          roleIDs: input.roleIDs
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserByID(outID)
  }

  async deleteUser({id}: DeleteUserArgs): Promise<string | null> {
    const {deletedCount} = await this.users.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async resetUserPassword({id, password}: ResetUserPasswordArgs): Promise<OptionalUser> {
    const {value} = await this.users.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          password: await bcrypt.hash(password, this.bcryptHashCostFactor)
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserByID(outID)
  }

  async getUsersByID(ids: string[]): Promise<OptionalUser[]> {
    const users = await this.users.find({_id: {$in: ids}}).toArray()
    return users.map(user => {
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        roleIDs: user.roleIDs
      }
    })
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        roleIDs: user.roleIDs
      }
    }

    return null
  }

  async getUserByID(id: string): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: id})
    if (user) {
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        roleIDs: user.roleIDs
      }
    } else {
      return null
    }
  }

  async getUsers({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetUsersArgs): Promise<ConnectionResult<User>> {
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

    const sortField = userSortFieldForSort(sort)
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

    const [totalCount, users] = await Promise.all([
      this.users.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.users
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = users.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? users.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? users.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstUser = nodes[0]
    const lastUser = nodes[nodes.length - 1]

    const startCursor = firstUser
      ? new Cursor(firstUser._id, userDateForSort(firstUser, sort)).toString()
      : null

    const endCursor = lastUser
      ? new Cursor(lastUser._id, userDateForSort(lastUser, sort)).toString()
      : null

    return {
      nodes: nodes.map<User>(({_id: id, ...user}) => ({id, ...user})),

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

function userSortFieldForSort(sort: UserSort) {
  switch (sort) {
    case UserSort.CreatedAt:
      return 'createdAt'

    case UserSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function userDateForSort(user: DBUser, sort: UserSort): Date {
  switch (sort) {
    case UserSort.CreatedAt:
      return user.createdAt

    case UserSort.ModifiedAt:
      return user.modifiedAt
  }
}
