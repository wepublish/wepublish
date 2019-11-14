import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLList,
  GraphQLID
} from 'graphql'

import {GraphQLUpload, FileUpload} from 'graphql-upload'
import {UserInputError} from 'apollo-server'

import {GraphQLArticleInput, GraphQLArticle, GraphQLArticleBlockUnionMap} from './article'

import {Context} from '../context'
import {generateID, generateTokenID} from '../utility'

import {InvalidCredentialsError} from '../error'
import {GraphQLSession} from './session'
import {GraphQLImage, GraphQLInputPoint} from './image'
import {BlockMap, ArticleBlock} from '../adapter/blocks'
import {ImageUpdate} from '../adapter/image'
import {VersionState} from '../adapter/versionState'

async function mapBlockUnionMap(value: any) {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types in ${GraphQLArticleBlockUnionMap.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLArticleBlockUnionMap.name
      }, they're mutually exclusive.`
    )
  }

  const key = Object.keys(value)[0] as keyof BlockMap
  return {type: key, key: await generateID(), ...value[key]} as ArticleBlock
}

export const GraphQLMutation = new GraphQLObjectType<any, Context>({
  name: 'Mutation',
  fields: {
    createSession: {
      type: GraphQLNonNull(GraphQLSession),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },

      async resolve(_root, {email, password}, {storageAdapter, sessionExpiry}) {
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
        input: {type: GraphQLNonNull(GraphQLArticleInput)}
      },
      async resolve(_root, {input}, {authenticate, storageAdapter}) {
        await authenticate()

        return storageAdapter.createArticle({
          ...input,
          id: await generateID(),
          state: VersionState.Draft,
          blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
        })
      }
    },
    updateArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLArticleInput)}
      },
      async resolve(_root, {id, input}, {authenticate, storageAdapter}) {
        await authenticate()

        const article = await storageAdapter.getArticle(id)

        if (!article) throw new UserInputError('Invalid article ID.')

        if (article.publishedVersion === article.latestVersion) {
          return storageAdapter.createArticleVersion(id, {
            ...input,
            id: await generateID(),
            state: VersionState.Draft,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        } else {
          return storageAdapter.updateArticleVersion(id, article.latestVersion, {
            ...input,
            id: await generateID(),
            state: VersionState.Draft,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        }
      }
    },
    publishArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(_root, {id}, {authenticate, storageAdapter}) {
        await authenticate()

        const article = await storageAdapter.getArticle(id)
        if (!article) throw new UserInputError('Invalid article ID.')

        const version = await storageAdapter.getArticleVersion(id, article.latestVersion)
        if (!version) throw new Error('Latest article version not found.')

        return storageAdapter.updateArticleVersion(id, article.latestVersion, {
          ...version,
          state: VersionState.Published,
          blocks: await storageAdapter.getArticleVersionBlocks(id, article.latestVersion)
        })
      }
    },
    uploadImages: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLImage))),
      args: {
        images: {
          type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUpload)))
        }
      },
      async resolve(_root, {images}, {authenticate, storageAdapter, mediaAdapter}) {
        await authenticate()

        for (const image of images) {
          if (!(image instanceof Promise)) throw new UserInputError('Invalid image')
        }

        return Promise.all(
          images.map(async (image: Promise<FileUpload>) => {
            const uploadImage = await mediaAdapter.uploadImage(image)

            return storageAdapter.createImage({
              ...uploadImage,
              createdAt: new Date(),
              updatedAt: new Date(),
              title: '',
              description: '',
              focalPoint: {x: 0.5, y: 0.5}, // TODO: Focal Point might be optional in the future to allow auto focus
              tags: []
            })
          })
        )
      }
    },
    updateImage: {
      type: GraphQLImage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        title: {type: GraphQLNonNull(GraphQLString)},
        description: {type: GraphQLNonNull(GraphQLString)},
        tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
        focalPoint: {type: GraphQLInputPoint}
      },
      resolve(root, args, {storageAdapter}) {
        return storageAdapter.updateImage(args as ImageUpdate)
      }
    }
  }
})

export default GraphQLMutation
