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

import {
  GraphQLArticleInput,
  GraphQLArticle,
  GraphQLArticleBlockUnionMap,
  GraphQLVersionState
} from './article'

import {Context} from '../context'
import {generateID, generateTokenID} from '../utility'

import {InvalidCredentialsError} from '../error'
import {GraphQLSession} from './session'
import {GraphQLImage, GraphQLInputPoint} from './image'
import {BlockMap, ArticleBlock} from '../adapter/blocks'
import {ImageUpdate} from '../adapter/image'
import {VersionState} from '../adapter/versionState'
import {GraphQLPage, GraphQLPageInput} from './page'

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
        const session = await storageAdapter.getSession(token)

        if (user.id !== session?.user.id) {
          return false
        }

        await storageAdapter.deleteSession(token)
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

        return storageAdapter.createArticle(await generateID(), {
          ...input,
          state: VersionState.Draft,
          blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
        })
      }
    },
    updateArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        state: {type: GraphQLNonNull(GraphQLVersionState)},
        input: {type: GraphQLNonNull(GraphQLArticleInput)}
      },
      async resolve(_root, {id, state, input}, {authenticate, storageAdapter}) {
        await authenticate()

        const article = await storageAdapter.getArticle(id)
        if (!article) throw new UserInputError('Invalid article ID.')

        const version = await storageAdapter.getArticleVersion(id, article.latestVersion)
        if (!version) throw new Error('Latest article version not found.')

        if (version.state === VersionState.Published) {
          return storageAdapter.createArticleVersion(id, {
            ...input,
            state: state,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        } else {
          return storageAdapter.updateArticleVersion(id, article.latestVersion, {
            ...input,
            state: state,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        }
      }
    },
    createPage: {
      type: GraphQLPage,
      args: {
        input: {type: GraphQLNonNull(GraphQLPageInput)}
      },
      async resolve(_root, {input}, {authenticate, storageAdapter}) {
        await authenticate()

        return storageAdapter.createPage(await generateID(), {
          ...input,
          state: VersionState.Draft,
          blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
        })
      }
    },
    updatePage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        state: {type: GraphQLNonNull(GraphQLVersionState)},
        input: {type: GraphQLNonNull(GraphQLPageInput)}
      },
      async resolve(_root, {id, state, input}, {authenticate, storageAdapter}) {
        await authenticate()

        const page = await storageAdapter.getPage(id)
        if (!page) throw new UserInputError('Invalid page ID.')

        const version = await storageAdapter.getPageVersion(id, page.latestVersion)
        if (!version) throw new Error('Latest page version not found.')

        if (version.state === VersionState.Published) {
          return storageAdapter.createPageVersion(id, {
            ...input,
            state: state,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        } else {
          return storageAdapter.updatePageVersion(id, page.latestVersion, {
            ...input,
            state: state,
            blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
          })
        }
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
        tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
        focalPoint: {type: GraphQLInputPoint}
      },
      resolve(root, args, {storageAdapter}) {
        return storageAdapter.updateImage(args as ImageUpdate)
      }
    }
  }
})

export default GraphQLMutation
