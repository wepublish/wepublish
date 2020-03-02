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
import {GraphQLArticleInput, GraphQLArticleBlockUnionMap, GraphQLArticle} from './article'
import {BlockMap, Block} from '../db/block'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLImage, GraphQLUploadImageInput, GraphQLUpdateImageInput} from './image'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'

function mapBlockUnionMap(value: any) {
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
  return {type: key, ...value[key]} as Block
}

export const GraphQLMutation = new GraphQLObjectType<undefined, Context>({
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

    // Author
    // ======

    // Navigation
    // ==========

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLAuthorInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        authenticate()
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
        authenticate()
        return dbAdapter.updateAuthor({id, input})
      }
    },

    deleteAuthor: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        authenticate()
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
        authenticate()

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
        authenticate()
        return dbAdapter.updateImage({id, input})
      }
    },

    deleteImage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, mediaAdapter, dbAdapter}) {
        authenticate()

        await mediaAdapter.deleteImage(id)
        return dbAdapter.deleteImage(id)
      }
    },

    // Article
    // =======

    createArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {input: {type: GraphQLNonNull(GraphQLArticleInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        authenticate()

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
        authenticate()

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
        authenticate()
        return dbAdapter.deleteArticle(id)
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
        authenticate()

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
        authenticate()
        return dbAdapter.unpublishArticle(id)
      }
    }

    // Page
    // ====
  }
})

// import {
//   GraphQLObjectType,
//   GraphQLString,
//   GraphQLNonNull,
//   GraphQLBoolean,
//   GraphQLID,
//   GraphQLInt
// } from 'graphql'

// import {UserInputError} from 'apollo-server'

// import {GraphQLArticleInput, GraphQLArticle, GraphQLArticleBlockUnionMap} from './article'

// import {Context} from '../context'
// import {generateID, generateTokenID} from '../utility'

// import {GraphQLSession} from './session'
// import {GraphQLPage, GraphQLPageInput} from './page'
// import {GraphQLImage, GraphQLUploadImageInput, GraphQLUpdateImageInput} from './image'
// import {InvalidCredentialsError} from '../error'

// import {VersionState} from '../adapter/versionState'
// import {BlockMap, ArticleBlock} from '../adapter/blocks'
// import {GraphQLAuthor, GraphQLCreateAuthorInput, GraphQLUpdateAuthorInput} from './author'
// import {GraphQLDateTime} from 'graphql-iso-date'

// async function mapBlockUnionMap(value: any) {
//   const valueKeys = Object.keys(value)

//   if (valueKeys.length === 0) {
//     throw new Error(`Received no block types in ${GraphQLArticleBlockUnionMap.name}.`)
//   }

//   if (valueKeys.length > 1) {
//     throw new Error(
//       `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
//         GraphQLArticleBlockUnionMap.name
//       }, they're mutually exclusive.`
//     )
//   }

//   const key = Object.keys(value)[0] as keyof BlockMap
//   return {type: key, ...value[key]} as ArticleBlock
// }

// export const GraphQLMutation = new GraphQLObjectType<any, Context, any>({
//   name: 'Mutation',
//   fields: {
//     // Session
//     // =======

//     createSession: {
//       type: GraphQLNonNull(GraphQLSession),
//       args: {
//         email: {type: GraphQLNonNull(GraphQLString)},
//         password: {type: GraphQLNonNull(GraphQLString)}
//       },

//       async resolve(_root, {email, password}, {storageAdapter, sessionExpiry}) {
//         const user = await storageAdapter.getUserForCredentials(email, password)
//         if (!user) throw new InvalidCredentialsError()

//         const token = await generateTokenID()

//         await storageAdapter.cleanSessions()
//         await storageAdapter.createSession(user, token, new Date(Date.now() + sessionExpiry))

//         return {
//           user,
//           token,
//           expiresIn: sessionExpiry
//         }
//       }
//     },

//     revokeSession: {
//       type: GraphQLNonNull(GraphQLBoolean),
//       args: {
//         token: {type: GraphQLNonNull(GraphQLString)}
//       },
//       async resolve(_root, {token}, {authenticate, storageAdapter}) {
//         const user = await authenticate()
//         const session = await storageAdapter.getSession(token)

//         if (user.id !== session?.user.id) {
//           return false
//         }

//         await storageAdapter.deleteSession(token)
//         return true
//       }
//     },

//     // Article
//     // =======

//     createArticle: {
//       type: GraphQLArticle,
//       args: {
//         input: {type: GraphQLNonNull(GraphQLArticleInput)}
//       },
//       async resolve(_root, {input}, {authenticate, storageAdapter}) {
//         await authenticate()

//         return storageAdapter.createArticle(await generateID(), {
//           ...input,
//           state: VersionState.Draft,
//           blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//         })
//       }
//     },

//     updateArticle: {
//       type: GraphQLArticle,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)},
//         input: {type: GraphQLNonNull(GraphQLArticleInput)}
//       },
//       async resolve(root, {id, input}, {authenticate, storageAdapter}) {
//         await authenticate()

//         const article = await storageAdapter.getArticle(id)
//         if (!article) throw new UserInputError('Invalid article ID.')

//         const version = await storageAdapter.getArticleVersion(id, article.latestVersion)
//         if (!version) throw new Error('Latest article version not found.')

//         if (version.state === VersionState.Published) {
//           return storageAdapter.createArticleVersion(id, {
//             ...input,
//             blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//           })
//         } else {
//           return storageAdapter.updateArticleVersion(id, article.latestVersion, {
//             ...input,
//             blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//           })
//         }
//       }
//     },

//     publishArticle: {
//       type: GraphQLArticle,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)},
//         version: {type: GraphQLNonNull(GraphQLInt)},
//         publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},
//         updatedAt: {type: GraphQLNonNull(GraphQLDateTime)}
//       },
//       async resolve(root, {id, version, publishedAt, updatedAt}, {authenticate, storageAdapter}) {
//         await authenticate()

//         return storageAdapter.publishArticleVersion(
//           id,
//           version,
//           new Date(publishedAt),
//           new Date(updatedAt)
//         )
//       }
//     },

//     unpublishArticle: {
//       type: GraphQLArticle,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)}
//       },
//       async resolve(root, {id}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.unpublishArticle(id)
//       }
//     },

//     deleteArticle: {
//       type: GraphQLBoolean,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)}
//       },
//       async resolve(root, {id}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.deleteArticle(id)
//       }
//     },

//     // TODO
//     // archiveArticle: {
//     //   type: GraphQLArticle,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)},
//     //   resolve() {} // TODO
//     // },

//     // unarchiveArticle: {
//     //   type: GraphQLArticle,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)},
//     //   resolve() {}
//     // },

//     // Page
//     // ====

//     createPage: {
//       type: GraphQLPage,
//       args: {
//         input: {type: GraphQLNonNull(GraphQLPageInput)}
//       },
//       async resolve(_root, {input}, {authenticate, storageAdapter}) {
//         await authenticate()

//         return storageAdapter.createPage(await generateID(), {
//           ...input,
//           state: VersionState.Draft,
//           blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//         })
//       }
//     },

//     updatePage: {
//       type: GraphQLPage,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)},
//         input: {type: GraphQLNonNull(GraphQLPageInput)}
//       },
//       async resolve(_root, {id, input}, {authenticate, storageAdapter}) {
//         await authenticate()

//         const page = await storageAdapter.getPage(id)
//         if (!page) throw new UserInputError('Invalid page ID.')

//         const version = await storageAdapter.getPageVersion(id, page.latestVersion)
//         if (!version) throw new Error('Latest page version not found.')

//         if (version.state === VersionState.Published) {
//           return storageAdapter.createPageVersion(id, {
//             ...input,
//             blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//           })
//         } else {
//           return storageAdapter.updatePageVersion(id, page.latestVersion, {
//             ...input,
//             blocks: await Promise.all(input.blocks.map(mapBlockUnionMap))
//           })
//         }
//       }
//     },

//     publishPage: {
//       type: GraphQLPage,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)},
//         version: {type: GraphQLNonNull(GraphQLInt)},
//         publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},
//         updatedAt: {type: GraphQLNonNull(GraphQLDateTime)}
//       },
//       async resolve(root, {id, version, publishedAt, updatedAt}, {authenticate, storageAdapter}) {
//         await authenticate()

//         return storageAdapter.publishPageVersion(
//           id,
//           version,
//           new Date(publishedAt),
//           new Date(updatedAt)
//         )
//       }
//     },

//     unpublishPage: {
//       type: GraphQLPage,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)}
//       },
//       async resolve(root, {id}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.unpublishPage(id)
//       }
//     },

//     deletePage: {
//       type: GraphQLBoolean,
//       args: {
//         id: {type: GraphQLNonNull(GraphQLID)}
//       },
//       async resolve(root, {id}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.deletePage(id)
//       }
//     },

//     // TODO
//     // archivePage: {
//     //   type: GraphQLPage,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)},
//     //   resolve() {}
//     // },

//     // unarchivePage: {
//     //   type: GraphQLPage,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)},
//     //   resolve() {}
//     // },

//     // Image
//     // =====

//     uploadImage: {
//       type: GraphQLImage,
//       args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
//       async resolve(root, {input}, {authenticate, storageAdapter, mediaAdapter}) {
//         await authenticate()

//         const {
//           file,
//           filename,
//           title,
//           description,
//           tags,
//           author,
//           source,
//           license,
//           focalPoint
//         } = input

//         if (!(file instanceof Promise)) throw new UserInputError('Invalid image')

//         const uploadImage = await mediaAdapter.uploadImage(file)

//         return storageAdapter.createImage({
//           ...uploadImage,

//           createdAt: new Date(),
//           updatedAt: new Date(),

//           filename: filename ? uploadImage.filename : filename,
//           title,
//           description,
//           tags,

//           author,
//           source,
//           license,

//           focalPoint
//         })
//       }
//     },

//     updateImage: {
//       type: GraphQLImage,
//       args: {input: {type: GraphQLNonNull(GraphQLUpdateImageInput)}},
//       async resolve(root, {input}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.updateImage({...input, updatedAt: new Date()})
//       }
//     },

//     deleteImage: {
//       type: GraphQLBoolean,
//       args: {id: {type: GraphQLNonNull(GraphQLID)}},
//       async resolve(root, {id}, {authenticate, mediaAdapter, storageAdapter}) {
//         await authenticate()

//         await mediaAdapter.deleteImage(id)
//         return storageAdapter.deleteImage(id)
//       }
//     },

//     // TODO
//     // archiveImage: {
//     //   type: GraphQLImage,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)}},
//     //   resolve() {}
//     // },

//     // unarchiveImage: {
//     //   type: GraphQLImage,
//     //   args: {id: {type: GraphQLNonNull(GraphQLID)}},
//     //   resolve() {}
//     // }

//     // Author
//     // ======

//     createAuthor: {
//       type: GraphQLAuthor,
//       args: {input: {type: GraphQLNonNull(GraphQLCreateAuthorInput)}},
//       async resolve(root, {input}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.createAuthor({...input, id: await generateID()})
//       }
//     },

//     updateAuthor: {
//       type: GraphQLAuthor,
//       args: {input: {type: GraphQLNonNull(GraphQLUpdateAuthorInput)}},
//       async resolve(root, {input}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.updateAuthor(input)
//       }
//     },

//     deleteAuthor: {
//       type: GraphQLBoolean,
//       args: {id: {type: GraphQLNonNull(GraphQLID)}},
//       async resolve(root, {id}, {authenticate, storageAdapter}) {
//         await authenticate()
//         return storageAdapter.deleteAuthor(id)
//       }
//     }

//     // TODO: Navigation
//   }
// })
