import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {sign as signJWT} from 'jsonwebtoken'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {GraphQLUserSession} from './session'
import {Context, ContextRequest} from '../context'

import {generateID, ArticleVersionState, generateToken} from '../../shared'
import {BlockMap, ArticleInput} from '../adapter'
import {IncomingMessage} from 'http'
import {contextFromRequest} from '../context'

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
    authenticate: {
      type: GraphQLUserSession,
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },

      async resolve(_root, {email, password}: CreateSessionArgs, {adapter}) {
        const [user, token] = await Promise.all([
          adapter.userForCredentials(email, password),
          generateToken()
        ])

        // TODO: Make expiresIn in configurable
        const refreshTokenExpiresIn = 60 * 60 * 24 * 7
        const accessTokenExpiresIn = 60 * 60

        // TODO: Make secret key configurable
        const refreshToken = signJWT({user}, 'secret', {
          expiresIn: 60 * 60 * 24 * 7,
          jwtid: token
        })

        const accessToken = signJWT({user}, 'secret', {
          expiresIn: accessTokenExpiresIn
        })

        await adapter.insertRefreshToken(user, token)

        // const [index, session] = Array.from(
        //   this._sessions.entries()).find(([_index, {token}]) => token === sessionToken
        // ) ?? []

        // if (index == null || !session) return null

        // const {user, expiry} = session

        // if (new Date() > expiry) {
        //   this._sessions.splice(index, 1)
        //   return null
        // }

        // return user

        return {
          user,
          refreshToken,
          accessToken,
          refreshTokenExpiresIn,
          accessTokenExpiresIn
        }
      }
    },
    refresh: {
      type: GraphQLNonNull(GraphQLID),
      args: {
        refreshToken: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {refreshToken}, {adapter}) {
        await adapter.verifyRefreshToken(refreshToken)
      }
    },
    revokeRefreshToken: {
      type: GraphQLNonNull(GraphQLID),
      async resolve(_root, _args, {token, adapter}) {
        if (token) await adapter.revokeRefreshToken(token)
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
