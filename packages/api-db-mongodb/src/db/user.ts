import bcrypt from 'bcrypt'

import {
  DBUserAdapter,
  CreateUserArgs,
  User,
  OptionalUser,
  GetUserForCredentialsArgs
} from '@wepublish/api'

import {Collection, Db, MongoError} from 'mongodb'

import {DBUser, CollectionName} from './schema'
import {MongoErrorCode} from '../utility'

export class MongoDBUserAdapter implements DBUserAdapter {
  private users: Collection<DBUser>
  private bcryptHashCostFactor: number

  constructor(db: Db, bcryptHashCostFactor: number) {
    this.users = db.collection(CollectionName.Users)
    this.bcryptHashCostFactor = bcryptHashCostFactor
  }

  async createUser({email, name, password, roleIDs}: CreateUserArgs): Promise<User> {
    try {
      const passwordHash = await bcrypt.hash(password, this.bcryptHashCostFactor)
      const {insertedId: id} = await this.users.insertOne({
        createdAt: new Date(),
        modifiedAt: new Date(),
        email,
        name,
        roleIDs,
        password: passwordHash
      })

      return {id, email, name, roleIDs}
    } catch (err) {
      if (err instanceof MongoError && err.code === MongoErrorCode.DuplicateKey) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  async getUser(email: string): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (!user) return null

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      roleIDs: user.roleIDs
    }
  }

  async getUsersByID(ids: string[]): Promise<OptionalUser[]> {
    const users = await this.users.find({_id: {$in: ids}}).toArray()

    return users.map<OptionalUser>(user => ({
      id: user._id,
      email: user.email,
      name: user.name,
      roleIDs: user.roleIDs
    }))
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (!user) return null

    const passwordMatches = await bcrypt.compare(password, user.password)

    if (!passwordMatches) return null

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      roleIDs: user.roleIDs
    }
  }

  async getUserByID(id: string): Promise<OptionalUser> {
    const user = await this.users.findOne({_id: id})

    if (!user) return null

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      roleIDs: user.roleIDs
    }
  }
}
