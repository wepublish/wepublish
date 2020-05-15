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
import {
  InvalidCredentialsError,
  OAuth2ProviderNotFoundError,
  InvalidOAuth2TokenError,
  UserNotFoundError
} from '../error'
import {GraphQLArticleInput, GraphQLArticle} from './article'
import {BlockMap, Block} from '../db/block'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLImage, GraphQLUploadImageInput, GraphQLUpdateImageInput} from './image'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {GraphQLPage, GraphQLPageInput} from './page'
import {GraphQLBlockInput} from './blocks'
import {Issuer} from 'openid-client'
import {
  CanCreateArticle,
  CanCreateAuthor,
  CanCreateImage,
  CanCreatePage,
  CanDeleteArticle,
  CanDeleteAuthor,
  CanDeleteImage,
  CanDeletePage,
  CanPublishArticle,
  CanPublishPage,
  authorise
} from './permissions'

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

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
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
        return await dbAdapter.createSessionForUser(user)
      }
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        code: {type: GraphQLNonNull(GraphQLString)},
        redirectUri: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {name, code, redirectUri}, {dbAdapter, oauth2Providers}) {
        try {
          const provider = oauth2Providers.find(provider => provider.name === name)
          if (!provider) throw new OAuth2ProviderNotFoundError()
          const issuer = await Issuer.discover(provider.discoverUrl)
          const client = new issuer.Client({
            client_id: provider.clientId,
            client_secret: provider.clientKey,
            redirect_uris: provider.redirectUri,
            response_types: ['code']
          })
          const token = await client.callback(redirectUri, {code})
          if (!token.access_token) throw new InvalidOAuth2TokenError()
          const userInfo = await client.userinfo(token.access_token)
          if (!userInfo.email) throw new Error('UserInfo did not return an email')
          const user = await dbAdapter.getUser(userInfo.email)
          if (!user) throw new UserNotFoundError()
          return await dbAdapter.createSessionForUser(user)
        } catch (error) {
          console.log('Error', error)
          return
        }
      }
    },

    revokeSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {user} = authenticate()
        return dbAdapter.deleteSessionByID(user, id)
      }
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      async resolve(root, {}, {session, dbAdapter}) {
        return session ? await dbAdapter.deleteSessionByToken(session.token) : false
      }
    },

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      args: {},
      async resolve(root, {}, {authenticate, dbAdapter}) {
        const {user} = authenticate()
        return dbAdapter.getSessionsForUser(user)
      }
    },

    // User
    // ====

    // Navigation
    // ==========

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLAuthorInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateAuthor, roles)
        return dbAdapter.createAuthor({input})
      }
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLAuthorInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateAuthor, roles)
        return dbAdapter.updateAuthor({id, input})
      }
    },

    deleteAuthor: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteAuthor, roles)
        await dbAdapter.deleteAuthor({id})
        return id
      }
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
      async resolve(root, {input}, {authenticate, mediaAdapter, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateImage, roles)

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
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateImage, roles)
        return dbAdapter.updateImage({id, input})
      }
    },

    deleteImage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, mediaAdapter, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteImage, roles)

        await mediaAdapter.deleteImage(id)
        return dbAdapter.deleteImage({id})
      }
    },

    // Article
    // =======

    createArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {input: {type: GraphQLNonNull(GraphQLArticleInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateArticle, roles)

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
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateArticle, roles)

        return dbAdapter.updateArticle({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deleteArticle: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeleteArticle, roles)
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
      async resolve(root, {id, publishAt, updatedAt, publishedAt}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishArticle, roles)

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
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishArticle, roles)
        return dbAdapter.unpublishArticle({id})
      }
    },

    // Page
    // =======

    createPage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {input: {type: GraphQLNonNull(GraphQLPageInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePage, roles)

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
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePage, roles)

        return dbAdapter.updatePage({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deletePage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanDeletePage, roles)
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
      async resolve(root, {id, publishAt, updatedAt, publishedAt}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishPage, roles)

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
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanPublishPage, roles)
        return dbAdapter.unpublishPage({id})
      }
    }
  }
})
