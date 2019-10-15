import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {sign as signJWT, verify as verifyJTW} from 'jsonwebtoken'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'

import {GraphQLTokenAuthResponse, GraphQLCredentialAuthResponse} from './session'

import {Context, ContextRequest} from '../context'

import {generateID, ArticleVersionState, generateTokenID} from '../../shared'
import {BlockMap, ArticleInput, AdapterUser} from '../adapter'
import {IncomingMessage} from 'http'
import {contextFromRequest} from '../context'

import {verifyRefreshToken} from '../utility'

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
        const [user, token] = await Promise.all<AdapterUser | null, string>([
          adapter.userForCredentials(email, password),
          generateTokenID()
        ])

        if (!user) throw new Error('Invalid credentials!')

        // TODO: Make secret key configurable
        const refreshToken = signJWT({}, tokenSecret, {
          expiresIn: refreshTokenExpiresIn,
          subject: `user:${user.email}`,
          audience: 'refresh',
          jwtid: token
        })

        const accessToken = signJWT({}, tokenSecret, {
          subject: `user:${user.email}`,
          audience: 'access',
          expiresIn: accessTokenExpiresIn
        })

        await adapter.insertRefreshTokenID(user, token)

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
      async resolve(_root, {refreshToken}, {adapter}) {
        const {email, id} = verifyRefreshToken(refreshToken)
        const user = await adapter.userForEmail(email)

        await adapter.verifyRefreshTokenID(id)
      }
    },
    revokeRefreshToken: {
      type: GraphQLNonNull(GraphQLID),
      args: {
        refreshToken: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {refreshToken}, {token, user, adapter}) {
        verifyRefreshToken(refreshToken)

        if (token && user) await adapter.revokeRefreshTokenID(refreshToken)
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
      async resolve(_root, {article}: ArticleCreateArguments, {adapter, user}) {
        if (!user) throw new Error('Access Denied')

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
