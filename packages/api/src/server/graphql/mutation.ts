import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLBoolean
} from 'graphql'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {GraphQLUserSession} from './session'
import {Context} from '../context'

import {generateID, ArticleVersionState} from '../../shared'
import {BlockMap, ArticleInput} from '../adapter'

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
      resolve() {}
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
      resolve(_root, args: ArticleCreateArguments, context: Context) {
        const articleInput: ArticleInput = {
          ...args.article,
          blocks: args.article.blocks.map(value => {
            const numKeys = Object.keys(value).length

            if (numKeys === 0) {
              throw new Error(`Received no block types in ${GraphQLInputBlockUnionMap.name}.`)
            }

            if (numKeys > 1) {
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

        return context.adapter.createArticle(generateID(), articleInput)
      }
    }
  }
})

export default GraphQLMutation
