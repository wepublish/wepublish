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
    authorize: {
      type: GraphQLUserSession,
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },

      async resolve(_root, {email, password}: CreateSessionArgs, {adapter}) {
        // const [user, verifyToken] = await Promise.all([
        //   adapter.userForCredentials(email, password)
        // ])

        const user = adapter.userForCredentials(email, password)

        // TODO: Make expiresIn in configurable
        const refreshTokenExpiresIn = 60 * 60 * 24 * 7
        const accessTokenExpiresIn = 60 * 60

        const refreshTokenExpiry = new Date(Date.now() + refreshTokenExpiresIn * 1000)
        const accessTokenExpiry = new Date(Date.now() + accessTokenExpiresIn * 1000)

        // TODO: Make secret key configurable
        const refreshToken = signJWT({user, exp: refreshTokenExpiry.getTime() / 1000}, 'secret')
        const accessToken = signJWT({user, exp: accessTokenExpiry.getTime() / 1000}, 'secret')

        await adapter.insertRefreshToken(refreshToken)

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
    deauthorize: {
      type: GraphQLNonNull(GraphQLID),
      resolve() {}
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
