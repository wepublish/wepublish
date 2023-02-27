import {PrismaClient, User} from '@prisma/client'
import nanoid from 'nanoid/generate'
import {Issuer} from 'openid-client'
import {Context} from '../../context'
import {AuthSessionType} from '@wepublish/authentication/api'
import {unselectPassword} from '@wepublish/user/api'
import {
  InvalidCredentialsError,
  InvalidOAuth2TokenError,
  NotActiveError,
  OAuth2ProviderNotFoundError,
  UserNotFoundError
} from '../../error'
import {getUserForCredentials} from '../user/user.queries'

const IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateToken() {
  return nanoid(IDAlphabet, 32)
}

export const revokeSessionByToken = (
  authenticateUser: Context['authenticateUser'],
  sessionClient: PrismaClient['session']
) => {
  const session = authenticateUser()

  return session
    ? sessionClient.delete({
        where: {
          token: session.token
        }
      })
    : Promise.resolve()
}

export const createUserSession = async (
  user: User,
  sessionTTL: number,
  sessionClient: PrismaClient['session'],
  userRoleClient: PrismaClient['userRole']
) => {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + sessionTTL)

  const {id, createdAt} = await sessionClient.create({
    data: {
      token,
      userID: user.id,
      expiresAt
    }
  })

  return {
    type: AuthSessionType.User,
    id,
    user,
    token,
    createdAt,
    expiresAt,
    roles: await userRoleClient.findMany({
      where: {
        id: {
          in: user.roleIDs
        }
      }
    })
  }
}

export const createSession = async (
  email: string,
  password: string,
  sessionTTL: Context['sessionTTL'],
  sessionClient: PrismaClient['session'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
) => {
  const user = await getUserForCredentials(email, password, userClient)
  if (!user) throw new InvalidCredentialsError()
  if (!user.active) throw new NotActiveError()

  return await createUserSession(user, sessionTTL, sessionClient, userRoleClient)
}

export const createJWTSession = async (
  jwt: string,
  sessionTTL: Context['sessionTTL'],
  verifyJWT: Context['verifyJWT'],
  sessionClient: PrismaClient['session'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
) => {
  const userID = verifyJWT(jwt)

  const user = await userClient.findUnique({
    where: {id: userID},
    select: unselectPassword
  })
  if (!user) throw new InvalidCredentialsError()
  if (!user.active) throw new NotActiveError()

  return await createUserSession(user, sessionTTL, sessionClient, userRoleClient)
}

export const createOAuth2Session = async (
  name: string,
  code: string,
  redirectUri: string,
  sessionTTL: Context['sessionTTL'],
  oauth2Providers: Context['oauth2Providers'],
  sessionClient: PrismaClient['session'],
  userClient: PrismaClient['user'],
  userRoleClient: PrismaClient['userRole']
) => {
  const provider = oauth2Providers.find(provider => provider.name === name)
  if (!provider) throw new OAuth2ProviderNotFoundError()

  const issuer = await Issuer.discover(provider.discoverUrl)
  const client = new issuer.Client({
    client_id: provider.clientId,
    client_secret: provider.clientKey,
    redirect_uris: provider.redirectUri,
    response_types: ['code']
  })

  const token = await client.callback(redirectUri, {code})
  if (!token.access_token) throw new InvalidOAuth2TokenError()

  const userInfo = await client.userinfo(token.access_token)
  if (!userInfo.email) throw new Error('UserInfo did not return an email')

  const user = await userClient.findUnique({
    where: {email: userInfo.email},
    select: unselectPassword
  })
  if (!user) throw new UserNotFoundError()
  if (!user.active) throw new NotActiveError()

  return await createUserSession(user, sessionTTL, sessionClient, userRoleClient)
}
