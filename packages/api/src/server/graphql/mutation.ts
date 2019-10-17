import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {TokenExpiredError as JWTTokenExpiredError} from 'jsonwebtoken'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {GraphQLTokenAuthResponse, GraphQLCredentialAuthResponse} from './session'
import {Context, AuthenticationContextType} from '../context'
import {generateID, ArticleVersionState, generateTokenID} from '../../client'
import {BlockMap, ArticleInput, AdapterUser} from '../adapter'

import {
  verifyRefreshToken,
  signRefreshToken,
  signAccessToken,
  SubjectType,
  AccessScope
} from '../utility'

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
          SubjectType.User,
          user.id,
          [AccessScope.Admin],
          refreshTokenExpiresIn,
          tokenSecret
        )

        const accessToken = signAccessToken(
          SubjectType.User,
          user.id,
          [AccessScope.Admin],
          accessTokenExpiresIn,
          tokenSecret
        )

        await adapter.insertUserSessionTokenID(user, [AccessScope.Admin], tokenID)

        return {
          user,
          refreshToken,
          accessToken,
          refreshTokenExpiresIn,
          accessTokenExpiresIn
        }
      }
    },
    authenticateWithToken: {
      type: GraphQLNonNull(GraphQLTokenAuthResponse),
      args: {
        token: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {token}, {adapter, tokenSecret, accessTokenExpiresIn}) {
        try {
          const {type, subject, id, scope} = verifyRefreshToken(token, tokenSecret)

          const valid =
            type === SubjectType.User
              ? await adapter.verifyUserSessionTokenID(id)
              : await adapter.verifyPeerTokenID(id)

          if (valid) {
            const user = await adapter.userForID(subject)

            if (user) {
              const accessToken = signAccessToken(
                type,
                user.email,
                scope,
                accessTokenExpiresIn,
                tokenSecret
              )

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
    revokeUserToken: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {
        token: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {token}, {authentication, tokenSecret, adapter}) {
        if (authentication.type !== AuthenticationContextType.User) {
          if (authentication.type === AuthenticationContextType.Unauthenticated) {
            throw authentication.error
          }

          throw new UnauthorizedError()
        }

        try {
          const {type, subject, scope, id} = verifyRefreshToken(token, tokenSecret)

          if (
            type === SubjectType.User &&
            authentication.user.id === subject &&
            scope.includes(AccessScope.PeerTokenWrite)
          ) {
            await adapter.revokeUserSessionTokenID(id)
            return true
          }
        } catch (err) {
          if (err instanceof JWTTokenExpiredError) {
            throw new TokenExpiredError()
          }
        }

        throw new InvalidTokenError()
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
