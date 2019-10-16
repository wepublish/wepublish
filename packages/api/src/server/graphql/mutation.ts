import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {
  sign as signJWT,
  verify as verifyJTW,
  TokenExpiredError as JWTTokenExpiredError
} from 'jsonwebtoken'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'

import {GraphQLTokenAuthResponse, GraphQLCredentialAuthResponse} from './session'

import {Context, ContextRequest, AuthenticationContextType} from '../context'

import {generateID, ArticleVersionState, generateTokenID} from '../../client'
import {BlockMap, ArticleInput, AdapterUser} from '../adapter'
import {IncomingMessage} from 'http'
import {contextFromRequest} from '../context'

import {verifyRefreshToken, signRefreshToken, signAccessToken} from '../utility'
import {
  UnauthorizedError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError
} from './error'

interface CreateSessionArgs {
  readonly email: string
  readonly password: string
}

interface ArticleCreateArguments {
  article: {
    state: ArticleVersionState

    title: string
    lead: string

    publishDate?: Date
    blocks: BlockMap[]
  }
}

export const GraphQLMutation = new GraphQLObjectType<never, Context, any>({
  name: 'Mutation',
  fields: {
    authenticateWithCredentials: {
      type: GraphQLNonNull(GraphQLCredentialAuthResponse),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },

      async resolve(
        _root,
        {email, password}: CreateSessionArgs,
        {adapter, tokenSecret, refreshTokenExpiresIn, accessTokenExpiresIn}
      ) {
        const [user, tokenID] = await Promise.all<AdapterUser | null, string>([
          adapter.userForCredentials(email, password),
          generateTokenID()
        ])

        if (!user) throw new InvalidCredentialsError()

        const refreshToken = signRefreshToken(
          tokenID,
          user.email,
          tokenSecret,
          refreshTokenExpiresIn
        )

        const accessToken = signAccessToken(user.email, tokenSecret, accessTokenExpiresIn)

        await adapter.insertRefreshTokenID(user, tokenID)

        return {
          user,
          refreshToken,
          accessToken,
          refreshTokenExpiresIn,
          accessTokenExpiresIn
        }
      }
    },
    authenticateWithRefreshToken: {
      type: GraphQLNonNull(GraphQLTokenAuthResponse),
      args: {
        refreshToken: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {refreshToken}, {adapter, tokenSecret, accessTokenExpiresIn}) {
        try {
          const {email, id} = verifyRefreshToken(refreshToken, tokenSecret)

          if (await adapter.verifyRefreshTokenID(id)) {
            const user = await adapter.userForEmail(email)

            if (user) {
              const accessToken = signAccessToken(user.email, tokenSecret, accessTokenExpiresIn)
              return {user, accessToken, accessTokenExpiresIn}
            }
          }
        } catch (err) {
          if (err instanceof JWTTokenExpiredError) {
            throw new TokenExpiredError()
          }
        }

        throw new InvalidTokenError()
      }
    },
    revokeRefreshToken: {
      type: GraphQLNonNull(GraphQLID),
      args: {
        refreshToken: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {refreshToken}, {authentication, tokenSecret, adapter}) {
        if (authentication.type !== AuthenticationContextType.User) {
          if (authentication.type === AuthenticationContextType.Unauthenticated) {
            throw authentication.error
          }

          throw new UnauthorizedError()
        }

        const {email, id} = verifyRefreshToken(refreshToken, tokenSecret)

        if (authentication.user.email === email) {
          await adapter.revokeRefreshTokenID(id)
          return refreshToken
        }

        throw new Error('Invalid refresh token.')
      }
    },
    createArticle: {
      type: GraphQLArticle,
      args: {
        article: {
          type: GraphQLNonNull(GraphQLArticleInput),
          description: 'Article to create.'
        }
      },
      async resolve(_root, {article}: ArticleCreateArguments, {adapter, authentication}) {
        if (authentication.type !== AuthenticationContextType.User) {
          if (authentication.type === AuthenticationContextType.Unauthenticated) {
            throw authentication.error
          }

          throw new UnauthorizedError()
        }

        const articleInput: ArticleInput = {
          ...article,
          blocks: article.blocks.map(value => {
            const valueKeys = Object.keys(value)

            if (valueKeys.length === 0) {
              throw new Error(`Received no block types in ${GraphQLInputBlockUnionMap.name}.`)
            }

            if (valueKeys.length > 1) {
              throw new Error(
                `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
                  GraphQLInputBlockUnionMap.name
                }, they're mutually exclusive.`
              )
            }

            const key = Object.keys(value)[0] as keyof BlockMap

            return {type: key, ...value[key]} as any // TODO
          })
        }

        return adapter.createArticle(await generateID(), articleInput)
      }
    }
  }
})

export default GraphQLMutation
