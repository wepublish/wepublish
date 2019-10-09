import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean
} from 'graphql'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {GraphQLUserSession} from './session'
import {Context, ContextRequest} from '../context'

import {generateID, ArticleVersionState} from '../../shared'
import {BlockMap, ArticleInput} from '../adapter'
import {IncomingMessage} from 'http'
import {contextFromRequest} from '../context'

export interface ArticleCreateArguments {
  article: {
    state: ArticleVersionState

    title: string
    lead: string

    publishDate?: Date
    blocks: BlockMap[]
  }
}

export const GraphQLMutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createAccessToken: {
      type: GraphQLUserSession,
      args: {
        username: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve(_root: any, _args: any, req: ContextRequest) {
        const {adapter, user} = contextFromRequest(req)
        console.log(user, adapter)
        return {}
      }
    },
    revokeAccessToken: {
      type: GraphQLNonNull(GraphQLBoolean),
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
      resolve(_root, args: ArticleCreateArguments, req: ContextRequest) {
        const {adapter, user} = contextFromRequest(req)
        const articleInput: ArticleInput = {
          ...args.article,
          blocks: args.article.blocks.map(value => {
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
