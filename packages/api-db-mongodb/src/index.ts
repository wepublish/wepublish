import nanoid from 'nanoid/generate'
import bcrypt from 'bcrypt'

import {MongoClient, Db, Collection, MongoError} from 'mongodb'

import {
  DBAdapter,
  CreateUserArgs,
  GetUserForCredentialsArgs,
  User,
  OptionalUser,
  OptionalImage,
  OptionalSession,
  CreateImageArgs,
  UpdateImageArgs
} from '@wepublish/api'

export const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return nanoid(idAlphabet, 16)
}

export function generateToken() {
  return nanoid(idAlphabet, 32)
}

export enum CollectionName {
  Users = 'users',
  Sessions = 'sessions'
}

export interface MongoDBAdapterConnectOpts {
  readonly url: string
  readonly database: string
}

const BcryptHashCostFactor = 11
const SessionExpiry = 1000 * 60 * 24 * 7 // 1w

interface MongoDBAdapterOpts {
  readonly client: MongoClient
  readonly db: Db

  readonly users: Collection
  readonly sessions: Collection
}

export class MongoDBAdapter implements DBAdapter {
  // private client: MongoClient
  private users: Collection
  private sessions: Collection

  private constructor({client, db, users, sessions}: MongoDBAdapterOpts) {
    // this.client = client
    this.users = users
    this.sessions = sessions
  }

  static async connect({url, database}: MongoDBAdapterConnectOpts) {
    const client = await MongoClient.connect(url, {
      useUnifiedTopology: true
    })

    const db = client.db(database)
    const users = await db.createCollection(CollectionName.Users)
    const sessions = await db.createCollection(CollectionName.Sessions)

    await users.createIndex({email: 1}, {unique: true})

    return new MongoDBAdapter({client, db, users, sessions})
  }

  async createUser({email, password}: CreateUserArgs): Promise<User> {
    try {
      const id = generateID()
      const passwordHash = await bcrypt.hash(password, BcryptHashCostFactor)

      await this.users.insertOne({
        _id: id,
        email,
        password: passwordHash
      })

      return {id, email}
    } catch (err) {
      if (err instanceof MongoError && err.code === 11000) {
        throw new Error('Email address already exists!')
      }

      throw err
    }
  }

  getUsersByID(ids: string[]): Promise<OptionalUser> {
    throw new Error('Method not implemented.')
  }

  async getUserForCredentials({email, password}: GetUserForCredentialsArgs): Promise<OptionalUser> {
    const user = await this.users.findOne({email})

    if (user && (await bcrypt.compare(password, user.password))) {
      return {id: user._id, email: user.email}
    }

    return null
  }

  createImage(image: CreateImageArgs): Promise<OptionalImage> {
    throw new Error('Method not implemented.')
  }
  updateImage(image: UpdateImageArgs): Promise<OptionalImage> {
    throw new Error('Method not implemented.')
  }
  deleteImage(id: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getImagesByID(ids: readonly string[]): Promise<OptionalImage[]> {
    throw new Error('Method not implemented.')
  }

  async createSessionForUser(user: User): Promise<OptionalSession> {
    const token = generateToken()
    const expiryDate = new Date(Date.now() + SessionExpiry)

    await this.sessions.insertOne({
      _id: token,
      userID: user.id,
      expiryDate: expiryDate
    })

    return {user, token, expiryDate}
  }

  deleteSession(token: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getSessionByToken(token: string): Promise<OptionalSession> {
    throw new Error('Method not implemented.')
  }
}
