import {GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean, GraphQLID} from 'graphql'

import {UserInputError} from 'apollo-server'

import {
  GraphQLArticleInput,
  GraphQLArticle,
  GraphQLArticleBlockUnionMap,
  GraphQLVersionState
} from './article'

import {Context} from '../context'
import {generateID, generateTokenID} from '../utility'

import {GraphQLSession} from './session'
import {GraphQLPage, GraphQLPageInput} from './page'
import {GraphQLImage, GraphQLUploadImageInput, GraphQLUpdateImageInput} from './image'
import {InvalidCredentialsError} from '../error'

import {VersionState} from '../adapter/versionState'
import {BlockMap, ArticleBlock} from '../adapter/blocks'
import {GraphQLAuthor, GraphQLCreateAuthorInput, GraphQLUpdateAuthorInput} from './author'

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
  return {type: key, ...value[key]} as ArticleBlock
}

export const GraphQLMutation = new GraphQLObjectType<any, Context, any>({
  name: 'Mutation',
  fields: {
    // Session
    // =======

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

        await storageAdapter.cleanSessions()
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

    // Article
    // =======

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

    // TODO
    // archiveArticle: {
    //   type: GraphQLArticle,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)},
    //   resolve() {} // TODO
    // },

    // unarchiveArticle: {
    //   type: GraphQLArticle,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)},
    //   resolve() {}
    // },

    // Page
    // ====

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

    // TODO
    // archivePage: {
    //   type: GraphQLPage,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)},
    //   resolve() {}
    // },

    // unarchivePage: {
    //   type: GraphQLPage,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)},
    //   resolve() {}
    // },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
      async resolve(root, {input}, {authenticate, storageAdapter, mediaAdapter}) {
        await authenticate()

        const {
          file,
          filename,
          title,
          description,
          tags,
          author,
          source,
          license,
          focalPoint
        } = input

        if (!(file instanceof Promise)) throw new UserInputError('Invalid image')

        const uploadImage = await mediaAdapter.uploadImage(file)

        return storageAdapter.createImage({
          ...uploadImage,

          createdAt: new Date(),
          updatedAt: new Date(),

          filename: filename ? uploadImage.filename : filename,
          title,
          description,
          tags,

          author,
          source,
          license,

          focalPoint
        })
      }
    },

    updateImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUpdateImageInput)}},
      async resolve(root, {input}, {authenticate, storageAdapter}) {
        await authenticate()
        return storageAdapter.updateImage({...input, updatedAt: new Date()})
      }
    },

    // TODO
    // archiveImage: {
    //   type: GraphQLImage,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)}},
    //   resolve() {}
    // },

    // unarchiveImage: {
    //   type: GraphQLImage,
    //   args: {id: {type: GraphQLNonNull(GraphQLID)}},
    //   resolve() {}
    // }

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLCreateAuthorInput)}},
      async resolve(root, {input}, {authenticate, storageAdapter}) {
        await authenticate()
        return storageAdapter.createAuthor({...input, id: await generateID()})
      }
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLUpdateAuthorInput)}},
      async resolve(root, {input}, {authenticate, storageAdapter}) {
        await authenticate()
        return storageAdapter.updateAuthor(input)
      }
    },

    deleteAuthor: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, storageAdapter}) {
        await authenticate()
        return storageAdapter.deleteAuthor(id)
      }
    }

    // TODO: Navigation
  }
})
