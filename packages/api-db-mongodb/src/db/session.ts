import {
  OptionalUserSession,
  OptionalSession,
  User,
  SessionType,
  UserSession,
  DBSessionAdapter
} from '@dev7ch/wepublish-api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBSession, DBToken} from './schema'
import {generateToken} from '../utility'
import {MongoDBUserAdapter} from './user'
import {MongoDBUserRoleAdapter} from './userRole'

export class MongoDBSessionAdapter implements DBSessionAdapter {
  private sessions: Collection<DBSession>
  private tokens: Collection<DBToken>

  private user: MongoDBUserAdapter
  private userRole: MongoDBUserRoleAdapter

  private sessionTTL: number

  constructor(
    db: Db,
    user: MongoDBUserAdapter,
    userRole: MongoDBUserRoleAdapter,
    sessionTTL: number
  ) {
    this.sessions = db.collection(CollectionName.Sessions)
    this.tokens = db.collection(CollectionName.Tokens)

    this.user = user
    this.userRole = userRole

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

    return {
      type: SessionType.User,
      id,
      user,
      token,
      createdAt,
      expiresAt,
      roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
    }
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
        token: tokenMatch.token,
        roles: await this.userRole.getNonOptionalUserRolesByID(tokenMatch.roleIDs)
      }
    } else if (session) {
      const user = await this.user.getUserByID(session.userID)

      if (!user) return null

      return {
        type: SessionType.User,
        id: session._id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        user,
        roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
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
    const roles = await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)

    return sessions.map(session => ({
      type: SessionType.User,
      id: session._id,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      user,
      roles
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
      user: user,
      roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
    }
  }
}
