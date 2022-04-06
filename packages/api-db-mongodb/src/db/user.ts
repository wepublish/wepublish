import bcrypt from 'bcrypt'

import {
  ConnectionResult,
  CreateUserArgs,
  DBUserAdapter,
  DeleteUserArgs,
  DeleteUserOAuth2AccountArgs,
  GetUserByOAuth2AccountArgs,
  GetUserForCredentialsArgs,
  GetUsersArgs,
  InputCursorType,
  LimitType,
  OptionalUser,
  ResetUserPasswordArgs,
  SortOrder,
  TempUser,
  UpdatePaymentProviderCustomerArgs,
  UpdateUserArgs,
  User,
  UserOAuth2Account,
  UserOAuth2AccountArgs,
  UserSort
} from '@wepublish/api'

import {Collection, Db, FilterQuery, MongoCountPreferences, MongoError} from 'mongodb'

import {CollectionName, DBUser} from './schema'
import {escapeRegExp, MongoErrorCode} from '../utility'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'
import * as crypto from 'crypto'

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
        emailVerifiedAt: null,
        oauth2Accounts: [],
        name: input.name,
        firstName: input.firstName,
        preferredName: input.preferredName,
        address: input.address,
        active: input.active,
        lastLogin: null,
        properties: input.properties,
        roleIDs: input.roleIDs,
        password: passwordHash,
        paymentProviderCustomers: []
      })

      return this.getUserByID(id)
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  public async createUserFromTempUser(tempUser: TempUser): Promise<OptionalUser> {
    const newUser = await this.createUser({
      input: {
        email: tempUser.email,
        name: tempUser.name,
        firstName: tempUser.firstName,
        address: tempUser.address,
        preferredName: tempUser.preferredName,
        active: true,
        roleIDs: [],
        properties: [],
        emailVerifiedAt: null
      },
      password: crypto.randomBytes(48).toString('base64')
    })
    return newUser
  }

  async getUser(email: string): Promise<OptionalUser> {
    const user = await this.users.findOne({email})
    if (user) {
      return {
        id: user._id,
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        oauth2Accounts: user.oauth2Accounts,
        name: user.name,
        firstName: user.firstName,
        preferredName: user.preferredName,
        address: user.address,
        active: user.active,
        lastLogin: user.lastLogin,
        properties: user.properties,
        roleIDs: user.roleIDs,
        paymentProviderCustomers: user.paymentProviderCustomers
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
          firstName: input.firstName,
          preferredName: input.preferredName,
          address: input.address,
          active: input.active,
          properties: input.properties,
          email: input.email,
          emailVerifiedAt: input.emailVerifiedAt,
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
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        oauth2Accounts: user.oauth2Accounts,
        name: user.name,
        firstName: user.firstName,
        preferredName: user.preferredName,
        address: user.address,
        active: user.active,
        lastLogin: user.lastLogin,
        properties: user.properties,
        roleIDs: user.roleIDs,
        paymentProviderCustomers: user.paymentProviderCustomers
      }
    })
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        id: user._id,
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        oauth2Accounts: user.oauth2Accounts,
        name: user.name,
        firstName: user.firstName,
        preferredName: user.preferredName,
        address: user.address,
        active: user.active,
        lastLogin: user.lastLogin,
        properties: user.properties,
        roleIDs: user.roleIDs,
        paymentProviderCustomers: user.paymentProviderCustomers
      }
    }

    return null
  }

  async getUserByID(id: string): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: id})
    if (user) {
      return {
        id: user._id,
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        oauth2Accounts: user.oauth2Accounts,
        name: user.name,
        firstName: user.firstName,
        preferredName: user.preferredName,
        address: user.address,
        active: user.active,
        lastLogin: user.lastLogin,
        properties: user.properties,
        roleIDs: user.roleIDs,
        paymentProviderCustomers: user.paymentProviderCustomers
      }
    } else {
      return null
    }
  }

  async getUserByOAuth2Account({
    provider,
    providerAccountId
  }: GetUserByOAuth2AccountArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({
      oauth2Accounts: {$elemMatch: {provider, providerAccountId}}
    })
    if (user) {
      return {
        id: user._id,
        createdAt: user.createdAt,
        modifiedAt: user.modifiedAt,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        oauth2Accounts: user.oauth2Accounts,
        name: user.name,
        firstName: user.firstName,
        preferredName: user.preferredName,
        address: user.address,
        active: user.active,
        lastLogin: user.lastLogin,
        properties: user.properties,
        roleIDs: user.roleIDs,
        paymentProviderCustomers: user.paymentProviderCustomers
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

    const textFilter: FilterQuery<any> = {}
    if (filter && JSON.stringify(filter) !== '{}') {
      textFilter.$and = []
    }
    // TODO: Rename to search
    if (filter?.name !== undefined) {
      textFilter.$and?.push({name: {$regex: escapeRegExp(filter.name), $options: 'i'}})
    }

    if (filter?.text !== undefined) {
      textFilter.$and?.push({
        $or: [
          {name: {$regex: escapeRegExp(filter.text), $options: 'im'}},
          {firstName: {$regex: escapeRegExp(filter.text), $options: 'im'}},
          {email: {$regex: escapeRegExp(filter.text), $options: 'im'}}
        ]
      })
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
        .skip(limit.skip ?? 0)
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

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? users.length > limitCount
        : cursor.type === InputCursorType.After

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

  async updatePaymentProviderCustomers({
    userID,
    paymentProviderCustomers
  }: UpdatePaymentProviderCustomerArgs): Promise<OptionalUser> {
    const {value} = await this.users.findOneAndUpdate(
      {_id: userID},
      {
        $set: {
          modifiedAt: new Date(),
          paymentProviderCustomers: paymentProviderCustomers
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserByID(outID)
  }

  async addOAuth2Account({userID, oauth2Account}: UserOAuth2AccountArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: userID})
    if (!user) return null

    const accounts: UserOAuth2Account[] = [...user.oauth2Accounts, oauth2Account]

    const {value} = await this.users.findOneAndUpdate(
      {_id: userID},
      {
        $set: {
          modifiedAt: new Date(),
          oauth2Accounts: accounts
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserByID(outID)
  }

  async deleteOAuth2Account({
    userID,
    providerAccountId,
    provider
  }: DeleteUserOAuth2AccountArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: userID})
    if (!user) return null

    const {value} = await this.users.findOneAndUpdate(
      {_id: userID},
      {
        $set: {
          modifiedAt: new Date(),
          oauth2Accounts: user.oauth2Accounts.filter(
            account =>
              account.provider !== provider && account.providerAccountId !== providerAccountId
          )
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserByID(outID)
  }
}

function userSortFieldForSort(sort: UserSort) {
  switch (sort) {
    case UserSort.CreatedAt:
      return 'createdAt'

    case UserSort.ModifiedAt:
      return 'modifiedAt'

    case UserSort.Name:
      return 'name'
  }
}

function userDateForSort(user: DBUser, sort: UserSort): Date {
  switch (sort) {
    case UserSort.CreatedAt:
      return user.createdAt

    case UserSort.ModifiedAt:
      return user.modifiedAt

    case UserSort.Name:
      return user.createdAt
  }
}
