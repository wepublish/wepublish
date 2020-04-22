import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList
} from 'graphql'

import {GraphQLSession, GraphQLSessionWithToken} from './session'
import {Context} from '../context'
import {InvalidCredentialsError} from '../error'
import {GraphQLArticleInput, GraphQLArticle} from './article'
import {BlockMap, Block} from '../db/block'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLImage, GraphQLUploadImageInput, GraphQLUpdateImageInput} from './image'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {GraphQLPage, GraphQLPageInput} from './page'

import {GraphQLNavigation, GraphQLNavigationInput, GraphQLNavigationLinkInput} from './navigation'
import {GraphQLBlockInput} from './blocks'
import {GraphQLSettings, GraphQLSettingsInput} from './settings'
import {GraphQLPeer, GraphQLPeerRequestInput} from './peer'
import {createOutgoingPeerRequestToken} from '../peering'

function mapBlockUnionMap(value: any) {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types in ${GraphQLBlockInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLBlockInput.name
      }, they're mutually exclusive.`
    )
  }

  const key = Object.keys(value)[0] as keyof BlockMap
  return {type: key, ...value[key]} as Block
}

function mapNavigationLinkInput(value: any) {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no navigation link types in ${GraphQLNavigationLinkInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple navigation link  types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLNavigationLinkInput.name
      }, they're mutually exclusive.`
    )
  }

  const key = Object.keys(value)[0] as keyof BlockMap
  return {type: key, ...value[key]} as Block
}

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Settings
    // ========

    updateSettings: {
      type: GraphQLNonNull(GraphQLSettings),
      args: {input: {type: GraphQLNonNull(GraphQLSettingsInput)}},
      resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.updateSettings(input)
      }
    },

    // Peering
    // =======

    createOutgoingPeerRequest: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {input: {type: GraphQLNonNull(GraphQLPeerRequestInput)}},
      async resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        const token = await createOutgoingPeerRequestToken(input.apiURL, dbAdapter)
        return dbAdapter.createOutgoingPeerRequest(input.apiURL, token)
      }
    },

    createIncomingPeerRequest: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {input: {type: GraphQLNonNull(GraphQLPeerRequestInput)}},
      resolve(root, {input}, {dbAdapter}) {
        return dbAdapter.createIncomingPeerRequest(input.apiURL)
      }
    },

    // createPeerRequest: {
    //   type: GraphQLNonNull(PeerRequest)
    // },

    // acceptPeerRequest: {
    //   type: GraphQLNonNull(Peer)
    // },

    // Session
    // =======

    createSession: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {email, password}, {dbAdapter}) {
        const user = await dbAdapter.getUserForCredentials({email, password})
        if (!user) throw new InvalidCredentialsError()
        return await dbAdapter.createUserSession(user)
      }
    },

    revokeSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        return dbAdapter.deleteUserSessionByID(user, id)
      }
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      async resolve(root, {}, {session, dbAdapter}) {
        return session ? await dbAdapter.deleteUserSessionByToken(session.token) : false
      }
    },

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      args: {},
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        return dbAdapter.getUserSessions(user)
      }
    },

    // User
    // ====

    // Navigation
    // ==========

    createNavigation: {
      type: GraphQLNavigation,
      args: {input: {type: GraphQLNonNull(GraphQLNavigationInput)}},
      resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.createNavigation({
          ...input,
          links: input.links.map(mapNavigationLinkInput)
        })
      }
    },

    updateNavigation: {
      type: GraphQLNavigation,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLNavigationInput)}
      },
      resolve(root, {id, input}, {authenticateUser: authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.updateNavigation(id, {
          ...input,
          links: input.links.map(mapNavigationLinkInput)
        })
      }
    },

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLAuthorInput)}},
      resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.createAuthor({input})
      }
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLAuthorInput)}
      },
      resolve(root, {id, input}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.updateAuthor({id, input})
      }
    },

    deleteAuthor: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        await dbAdapter.deleteAuthor({id})
        return id
      }
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
      async resolve(root, {input}, {authenticateUser, mediaAdapter, dbAdapter}) {
        authenticateUser()

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

        const {id, ...image} = await mediaAdapter.uploadImage(file)

        return dbAdapter.createImage({
          id,
          input: {
            ...image,

            filename: filename ?? image.filename,
            title,
            description,
            tags,

            author,
            source,
            license,

            focalPoint
          }
        })
      }
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUpdateImageInput)}
      },
      resolve(root, {id, input}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.updateImage({id, input})
      }
    },

    deleteImage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, mediaAdapter, dbAdapter}) {
        authenticateUser()

        await mediaAdapter.deleteImage(id)
        return dbAdapter.deleteImage({id})
      }
    },

    // Article
    // =======

    createArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {input: {type: GraphQLNonNull(GraphQLArticleInput)}},
      async resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.createArticle({
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    updateArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLArticleInput)}
      },
      async resolve(root, {id, input}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.updateArticle({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deleteArticle: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.deleteArticle({id})
      }
    },

    publishArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      async resolve(root, {id, publishAt, updatedAt, publishedAt}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.publishArticle({
          id,
          publishAt,
          updatedAt,
          publishedAt
        })
      }
    },

    unpublishArticle: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.unpublishArticle({id})
      }
    },

    // Page
    // =======

    createPage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {input: {type: GraphQLNonNull(GraphQLPageInput)}},
      async resolve(root, {input}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.createPage({
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    updatePage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPageInput)}
      },
      async resolve(root, {id, input}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.updatePage({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deletePage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.deletePage({id})
      }
    },

    publishPage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      async resolve(root, {id, publishAt, updatedAt, publishedAt}, {authenticateUser, dbAdapter}) {
        authenticateUser()

        return dbAdapter.publishPage({
          id,
          publishAt,
          updatedAt,
          publishedAt
        })
      }
    },

    unpublishPage: {
      type: GraphQLPage,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.unpublishPage({id})
      }
    }
  }
})
