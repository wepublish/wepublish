import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {GraphQLUserSession} from './session'
import {Context, ContextRequest} from '../context'

import {generateID, ArticleVersionState} from '../../shared'
import {BlockMap, ArticleInput} from '../adapter'
import {IncomingMessage} from 'http'
import {contextFromRequest} from '../context'

interface CreateSessionArgs {
  username: string
  password: string
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
    createSession: {
      type: GraphQLUserSession,
      args: {
        username: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {username, password}: CreateSessionArgs, {adapter}) {
        const user = await adapter.userForCredentials(username, password)

        return adapter.createSession(user)
      }
    },
    revokeSessionToken: {
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
      resolve(_root, {article}: ArticleCreateArguments, {adapter, user}) {
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

        return adapter.createArticle(generateID(), articleInput)
      }
    }
  }
})

export default GraphQLMutation
