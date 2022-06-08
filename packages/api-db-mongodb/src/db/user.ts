import {
  CreateUserArgs,
  DBUserAdapter,
  DeleteUserArgs,
  DeleteUserOAuth2AccountArgs,
  GetUserForCredentialsArgs,
  OptionalUser,
  ResetUserPasswordArgs,
  TempUser,
  UpdatePaymentProviderCustomerArgs,
  UpdateUserArgs,
  UserOAuth2Account,
  UserOAuth2AccountArgs
} from '@wepublish/api'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import {Collection, Db, MongoError} from 'mongodb'
import {MongoErrorCode} from '../utility'
import {CollectionName, DBUser} from './schema'

export class MongoDBUserAdapter implements DBUserAdapter {
  private users: Collection<DBUser>
  private bcryptHashCostFactor: number

  constructor(db: Db, bcryptHashCostFactor: number) {
    this.users = db.collection(CollectionName.Users)
    this.bcryptHashCostFactor = bcryptHashCostFactor
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
        paymentProviderCustomers: input.paymentProviderCustomers || []
      })

      return this.getUserByID(id)
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  /**
   * For now, a user will be confirmed by a valid payment. When a user has a valid payment, the previously temporary
   * user is converted to a permanent user.
   * @param tempUser
   */
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
        emailVerifiedAt: null,
        paymentProviderCustomers: tempUser.paymentProviderCustomers
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
