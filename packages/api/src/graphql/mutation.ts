import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLUpload, FileUpload} from 'graphql-upload'
import {UserInputError} from 'apollo-server'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputArticleBlockUnionMap} from './article'

import {Context} from '../context'
import {generateID, generateTokenID} from '../utility'

import {InvalidCredentialsError} from '../error'
import {GraphQLSession} from './session'
import {GraphQLImage} from './image'
import {BlockMap} from '../adapter/blocks'
import {ArticleInput} from '../adapter/article'

interface CreateSessionArgs {
  readonly email: string
  readonly password: string
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

      async resolve(_root, {email, password}: CreateSessionArgs, {storageAdapter, sessionExpiry}) {
        const user = await storageAdapter.getUserForCredentials(email, password)
        if (!user) throw new InvalidCredentialsError()

        const token = await generateTokenID()
        await storageAdapter.createSession(user, token, new Date(Date.now() + sessionExpiry))

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
      async resolve(_root, {token}, {authenticate, storageAdapter}) {
        const user = await authenticate()
        await storageAdapter.deleteSession(user, token)
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
      async resolve(_root, {article}, {storageAdapter, authenticate}) {
        await authenticate()

        const articleInput: ArticleInput = {
          ...article,
          id: await generateID(),
          blocks: article.blocks.map((value: any) => {
            const valueKeys = Object.keys(value)

            if (valueKeys.length === 0) {
              throw new Error(
                `Received no block types in ${GraphQLInputArticleBlockUnionMap.name}.`
              )
            }

            if (valueKeys.length > 1) {
              throw new Error(
                `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
                  GraphQLInputArticleBlockUnionMap.name
                }, they're mutually exclusive.`
              )
            }

            const key = Object.keys(value)[0] as keyof BlockMap

            return {type: key, ...value[key]} as any // TODO
          })
        }

        return storageAdapter.createArticle(articleInput)
      }
    },
    uploadImage: {
      type: GraphQLImage,
      args: {
        file: {
          type: GraphQLUpload
        }
      },
      async resolve(_root, {file}, {authenticate, storageAdapter, mediaAdapter}) {
        await authenticate()

        if (!(file instanceof Promise)) throw new UserInputError('Invalid file')

        const uploadImage = await mediaAdapter.uploadImage(file as Promise<FileUpload>)
        return storageAdapter.createImage({...uploadImage, title: '', description: '', tags: []})
      }
    }
  }
})

export default GraphQLMutation
