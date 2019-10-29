import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLUpload, FileUpload} from 'graphql-upload'
import {UserInputError, ApolloError} from 'apollo-server'
import {fetch} from 'cross-fetch'
import FormData from 'form-data'

import {GraphQLArticle, GraphQLArticleInput, GraphQLInputArticleBlockUnionMap} from './article'
import {Context} from '../context'
import {ArticleVersionState} from '../types'
import {generateID, generateTokenID} from '../utility'
import {BlockMap, AdapterArticleInput} from '../adapter'

import {InvalidCredentialsError} from '../error'
import {GraphQLSession} from './session'
import {GraphQLImage} from './image'

interface CreateSessionArgs {
  readonly email: string
  readonly password: string
}

interface ArticleCreateArguments {
  article: {
    state: ArticleVersionState

    title: string
    lead: string
    slug: string

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
        await adapter.deleteSession(user, token)
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

        const articleInput: AdapterArticleInput = {
          ...article,
          id: await generateID(),
          featuredBlock: {} as any, // TODO
          blocks: article.blocks.map(value => {
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

        return adapter.createArticle(articleInput)
      }
    },
    uploadImage: {
      type: GraphQLImage,
      args: {
        file: {
          type: GraphQLUpload
        }
      },
      async resolve(_root, {file}, {mediaServerURL, mediaServerToken, authenticate, adapter}) {
        await authenticate()

        if (!(file instanceof Promise)) throw new UserInputError('Invalid file')

        const {filename, mimetype, createReadStream}: FileUpload = await file
        const form = new FormData()

        form.append('file', createReadStream(), {filename, contentType: mimetype, knownLength: 123})

        // The form-data module reports a known length for the stream returned by createReadStream,
        // which is wrong, override it and always set it to false.
        // Related issue: https://github.com/form-data/form-data/issues/394
        form.hasKnownLength = () => false

        const response = await fetch(mediaServerURL.toString(), {
          method: 'POST',
          headers: {authorization: `Bearer ${mediaServerToken}`},
          body: form as any // Uses node-fetch under the hood which allows FormData from the form-data module
        })

        const json = await response.json()

        if (response.status !== 200) {
          throw new ApolloError(`Received error from media server: ${JSON.stringify(json)}`)
        }

        return adapter.createImage({
          ...json,
          host: mediaServerURL.toString(),
          url: `${mediaServerURL.toString()}${json.id}`,
          tags: [],
          title: '',
          description: ''
        })
      }
    }
  }
})

export default GraphQLMutation
