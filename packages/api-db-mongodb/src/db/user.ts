import bcrypt from 'bcrypt'

import {
  DBUserAdapter,
  CreateUserArgs,
  User,
  OptionalUser,
  GetUserForCredentialsArgs
} from '@wepublish/api'

import {Collection, Db, MongoError} from 'mongodb'

import {DBUser, CollectionName} from '../schema'
import {MongoErrorCode} from '../utility'

export class MongoDBUserAdapter implements DBUserAdapter {
  private users: Collection<DBUser>
  private bcryptHashCostFactor: number

  constructor(db: Db, bcryptHashCostFactor: number) {
    this.users = db.collection(CollectionName.Users)
    this.bcryptHashCostFactor = bcryptHashCostFactor
  }

  async createUser({email, password}: CreateUserArgs): Promise<User> {
    try {
      const passwordHash = await bcrypt.hash(password, this.bcryptHashCostFactor)
      const {insertedId: id} = await this.users.insertOne({
        createdAt: new Date(),
        modifiedAt: new Date(),
        email,
        password: passwordHash
      })

      return {id, email}
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
      return {id: user._id, email: user.email}
    } else {
      return null
    }
  }

  async getUsersByID(ids: string[]): Promise<OptionalUser[]> {
    const users = await this.users.find({_id: {$in: ids}}).toArray()

    return users.map<OptionalUser>(user => ({
      id: user._id,
      email: user.email
    }))
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {id: user._id, email: user.email}
    }

    return null
  }

  async getUserByID(id: string): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: id})

    if (user) {
      return {id: user._id, email: user.email}
    } else {
      return null
    }
  }
}
