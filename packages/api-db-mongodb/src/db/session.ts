import {
  OptionalUserSession,
  OptionalSession,
  User,
  SessionType,
  UserSession,
  DBSessionAdapter
} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBSession, DBUser, DBToken} from '../schema'
import {generateToken} from '../utility'

export class MongoDBSessionAdapter implements DBSessionAdapter {
  private sessions: Collection<DBSession>
  private users: Collection<DBUser>
  private tokens: Collection<DBToken>

  private sessionTTL: number

  constructor(db: Db, sessionTTL: number) {
    this.sessions = db.collection(CollectionName.Sessions)
    this.users = db.collection(CollectionName.Users)
    this.tokens = db.collection(CollectionName.Tokens)
    this.sessionTTL = sessionTTL
  }

  async createUserSession(user: User): Promise<OptionalUserSession> {
    const token = generateToken()
    const createdAt = new Date()
    const expiresAt = new Date(Date.now() + this.sessionTTL)

    const {insertedId: id} = await this.sessions.insertOne({
      token: token,
      userID: user.id,
      createdAt,
      expiresAt
    })

    return {type: SessionType.User, id, user, token, createdAt, expiresAt}
  }

  async deleteUserSessionByToken(token: string): Promise<boolean> {
    const {deletedCount} = await this.sessions.deleteOne({token})
    return deletedCount === 1
  }

  async getSessionByToken(token: string): Promise<OptionalSession> {
    const [tokenMatch, session] = await Promise.all([
      this.tokens.findOne({token}),
      this.sessions.findOne({token})
    ])

    if (tokenMatch) {
      return {
        type: SessionType.Token,
        id: tokenMatch._id,
        name: tokenMatch.name,
        token: tokenMatch.token
      }
    } else if (session) {
      const user = await this.users.findOne({_id: session.userID}, {projection: {password: false}})

      if (!user) return null

      return {
        type: SessionType.User,
        id: session._id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        user: {
          id: user._id,
          email: user.email
        }
      }
    }

    return null
  }

  async deleteUserSessionByID(user: User, id: string): Promise<boolean> {
    const {deletedCount} = await this.sessions.deleteOne({_id: id, userID: user.id})
    return deletedCount === 1
  }

  async getUserSessions(user: User): Promise<UserSession[]> {
    const sessions = await this.sessions.find({userID: user.id}).toArray()

    return sessions.map(session => ({
      type: SessionType.User,
      id: session._id,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user: user
    }))
  }

  async getSessionByID(user: User, id: string): Promise<OptionalSession> {
    const session = await this.sessions.findOne({_id: id, userID: user.id})

    if (!session) return null

    return {
      type: SessionType.User,
      id: session._id,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user: user
    }
  }
}
