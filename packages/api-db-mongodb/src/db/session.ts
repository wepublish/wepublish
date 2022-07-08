import {DBSessionAdapter, OptionalUserSession, SessionType, User} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {generateToken} from '../utility'
import {CollectionName, DBSession} from './schema'
import {MongoDBUserAdapter} from './user'
import {MongoDBUserRoleAdapter} from './userRole'

export class MongoDBSessionAdapter implements DBSessionAdapter {
  private sessions: Collection<DBSession>

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

  async extendUserSessionByToken(token: string): Promise<OptionalUserSession> {
    const {value} = await this.sessions.findOneAndUpdate(
      {token},
      {
        $set: {
          expiresAt: new Date(Date.now() + this.sessionTTL)
        }
      },
      {returnOriginal: false}
    )
    if (!value) return null

    const user = await this.user.getUserByID(value.userID)
    if (!user) return null

    return {
      type: SessionType.User,
      id: value._id,
      token: value.token,
      createdAt: value.createdAt,
      expiresAt: value.expiresAt,
      user,
      roles: await this.userRole.getNonOptionalUserRolesByID(user.roleIDs)
    }
  }
}
