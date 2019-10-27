import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLUpload, FileUpload} from 'graphql-upload'
import {UserInputError} from 'apollo-server'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputBlockUnionMap} from './article'
import {Context} from '../context'
import {generateID, ArticleVersionState, generateTokenID} from '../../client'
import {BlockMap, ArticleInput} from '../adapter'

import {InvalidCredentialsError} from './error'
import {GraphQLSession} from './session'

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

export const GraphQLMutation = new GraphQLObjectType<any, Context, any>({
  name: 'Mutation',
  fields: {
    createSession: {
      type: GraphQLNonNull(GraphQLSession),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },

      async resolve(_root, {email, password}: CreateSessionArgs, {adapter, sessionExpiry}) {
        const user = await adapter.getUserForCredentials(email, password)

        if (!user) throw new InvalidCredentialsError()

        const token = await generateTokenID()

        await adapter.createSession(user, token, new Date(Date.now() + sessionExpiry))

        return {
          user,
          token,
          expiresIn: sessionExpiry
        }
      }
    },
    revokeSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {
        token: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(_root, {token}, {authenticate, adapter}) {
        const user = await authenticate()
        await adapter.revokeSession(user, token)
        return true
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
      async resolve(_root, {article}: ArticleCreateArguments, {adapter, authenticate}) {
        await authenticate()

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
    },
    uploadImage: {
      type: GraphQLString,
      args: {
        file: {
          type: GraphQLUpload
        }
      },
      async resolve(_root, {file}, {}) {
        if (!(file instanceof Promise)) throw new UserInputError('Invalid file')

        const {filename, mimetype, encoding, createReadStream}: FileUpload = await file
        console.log(filename, mimetype, encoding, createReadStream)
        // TODO
      }
    }
  }
})

export default GraphQLMutation
