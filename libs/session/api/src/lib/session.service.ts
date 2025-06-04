import {Inject, Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {SessionWithToken} from './session.model'
import {InvalidCredentialsError, NotActiveError} from './session.errors'
import nanoid from 'nanoid/generate'
import {UserAuthenticationService} from './user-authentication.service'
import {JwtAuthenticationService} from './jwt-authentication.service'
import {OAuthAuthenticationService} from './oauth-authentication.service'
import {UserSession} from '@wepublish/authentication/api'

const IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const SESSION_TTL_TOKEN = 'SESSION_TTL_TOKEN'
export const OAUTH2_CLIENTS_PROVIDER = 'OAUTH2_CLIENTS_PROVIDER'

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(SESSION_TTL_TOKEN) private readonly sessionTTL: number,
    private userAuthenticationService: UserAuthenticationService,
    private jwtAuthenticationService: JwtAuthenticationService,
    private oAuthAuthenticationService: OAuthAuthenticationService
  ) {}

  async createSessionWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<SessionWithToken> {
    const user = await this.userAuthenticationService.authenticateUserWithEmailAndPassword(
      email,
      password
    )

    if (!user) throw new InvalidCredentialsError()
    if (!user.active) throw new NotActiveError()

    return this.createUserSession(user.id)
  }

  async createSessionWithJWT(jwt: string): Promise<SessionWithToken> {
    const user = await this.jwtAuthenticationService.authenticateUserWithJWT(jwt)

    if (!user) throw new InvalidCredentialsError()
    if (!user.active) throw new NotActiveError()

    return this.createUserSession(user.id)
  }

  async createOAuth2Session(providerName: string, code: string, redirectUri: string) {
    const user = await this.oAuthAuthenticationService.authenticateUser(
      providerName,
      code,
      redirectUri
    )

    if (!user) throw new InvalidCredentialsError()
    if (!user.active) throw new NotActiveError()

    return this.createUserSession(user.id)
  }

  async revokeSession(session: UserSession | null) {
    if (!session) {
      return false
    }
    return !!(await this.prisma.session.delete({
      where: {
        token: session.token
      }
    }))
  }

  protected async createUserSession(userId: string): Promise<SessionWithToken> {
    const token = nanoid(IDAlphabet, 64)

    const expiresAt = new Date(Date.now() + this.sessionTTL)

    const {createdAt} = await this.prisma.session.create({
      data: {
        token,
        expiresAt,
        user: {
          connect: {
            id: userId
          }
        }
      }
    })

    return {
      user: {id: userId},
      token,
      createdAt,
      expiresAt
    }
  }
}
