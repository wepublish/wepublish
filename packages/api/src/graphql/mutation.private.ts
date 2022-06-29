import {Subscription} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {Issuer} from 'openid-client'
import {Context} from '../context'
import {ArticleRevision} from '../db/article'
import {Block, BlockMap, BlockType} from '../db/block'
import {CommentState} from '../db/comment'
import {PageRevision} from '../db/page'
import {PaymentState} from '../db/payment'
import {
  DuplicatePageSlugError,
  InvalidCredentialsError,
  InvalidOAuth2TokenError,
  NotActiveError,
  NotFound,
  OAuth2ProviderNotFoundError,
  UserNotFoundError
} from '../error'
import {SendMailType} from '../mails/mailContext'
import {GraphQLArticle, GraphQLArticleInput} from './article'
import {deleteArticleById} from './article/article.private-mutation'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {deleteAuthorById} from './author/author.private-mutation'
import {GraphQLBlockInput, GraphQLTeaserInput} from './blocks'
import {GraphQLComment, GraphQLCommentRejectionReason} from './comment'
import {GraphQLImage, GraphQLUpdateImageInput, GraphQLUploadImageInput} from './image'
import {deleteImageById} from './image/image.private-mutation'
import {GraphQLInvoice, GraphQLInvoiceInput} from './invoice'
import {deleteInvoiceById} from './invoice/invoice.private-mutation'
import {deleteMemberPlanById} from './member-plan/member-plan.private-mutation'
import {GraphQLMemberPlan, GraphQLMemberPlanInput} from './memberPlan'
import {GraphQLNavigation, GraphQLNavigationInput, GraphQLNavigationLinkInput} from './navigation'
import {deleteNavigationById} from './navigation/navigation.private-mutation'
import {GraphQLPage, GraphQLPageInput} from './page'
import {deletePageById} from './page/page.private-mutation'
import {GraphQLPayment, GraphQLPaymentFromInvoiceInput} from './payment'
import {deletePaymentMethodById} from './payment-method/payment-method.private-mutation'
import {GraphQLPaymentMethod, GraphQLPaymentMethodInput} from './paymentMethod'
import {
  GraphQLCreatePeerInput,
  GraphQLPeer,
  GraphQLPeerProfile,
  GraphQLPeerProfileInput,
  GraphQLUpdatePeerInput
} from './peer'
import {deletePeerById} from './peer/peer.private-mutation'
import {
  authorise,
  CanCreateArticle,
  CanCreateAuthor,
  CanCreateImage,
  CanCreateInvoice,
  CanCreateMemberPlan,
  CanCreateNavigation,
  CanCreatePage,
  CanCreatePayment,
  CanCreatePaymentMethod,
  CanCreatePeer,
  CanCreateSubscription,
  CanCreateToken,
  CanCreateUser,
  CanCreateUserRole,
  CanPublishArticle,
  CanPublishPage,
  CanResetUserPassword,
  CanSendJWTLogin,
  CanTakeActionOnComment,
  CanUpdatePeerProfile
} from './permissions'
import {GraphQLSession, GraphQLSessionWithToken} from './session'
import {revokeSessionByToken} from './session/session.mutation'
import {revokeSessionById} from './session/session.private-mutation'
import {getSessionsForUser} from './session/session.private-queries'
import {GraphQLSubscription, GraphQLSubscriptionInput} from './subscription'
import {deleteSubscriptionById} from './subscription/subscription.private-mutation'
import {GraphQLCreatedToken, GraphQLTokenInput} from './token'
import {deleteTokenById} from './token/token.private-mutation'
import {GraphQLUser, GraphQLUserInput} from './user'
import {deleteUserRoleById} from './user-role/user-role.private-mutation'
import {deleteUserById} from './user/user.private-mutation'
import {getUserForCredentials} from './user/user.queries'
import {GraphQLUserRole, GraphQLUserRoleInput} from './userRole'

function mapTeaserUnionMap(value: any) {
  if (!value) return null

  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no teaser types in ${GraphQLTeaserInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple teaser types (${JSON.stringify(Object.keys(value))}) in ${
        GraphQLTeaserInput.name
      }, they're mutually exclusive.`
    )
  }

  const type = Object.keys(value)[0] as keyof BlockMap
  const teaserValue = value[type]

  return {type, ...teaserValue} as Block
}

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

  const type = Object.keys(value)[0] as keyof BlockMap
  const blockValue = value[type]

  switch (type) {
    case BlockType.TeaserGrid:
      return {type, ...blockValue, teasers: blockValue.teasers.map(mapTeaserUnionMap)}

    case BlockType.TeaserGridFlex:
      return {
        type,
        ...blockValue,
        flexTeasers: blockValue.flexTeasers.map(({teaser, ...value}: any) => ({
          ...value,
          teaser: mapTeaserUnionMap(teaser)
        }))
      }

    default:
      return {type, ...blockValue} as Block
  }
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
    // Peering
    // =======

    updatePeerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      args: {input: {type: GraphQLNonNull(GraphQLPeerProfileInput)}},
      async resolve(root, {input}, {hostURL, authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanUpdatePeerProfile, roles)

        return {...(await dbAdapter.peer.updatePeerProfile(input)), hostURL}
      }
    },

    createPeer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {input: {type: GraphQLNonNull(GraphQLCreatePeerInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)

        // TODO: Check if valid peer?
        return dbAdapter.peer.createPeer(input)
      }
    },

    updatePeer: {
      type: GraphQLNonNull(GraphQLPeer),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUpdatePeerInput)}
      },
      async resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)

        // TODO: Check if valid peer?
        return dbAdapter.peer.updatePeer(id, input)
      }
    },

    deletePeer: {
      type: GraphQLID,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {peer}}) =>
        deletePeerById(id, authenticate, peer)
    },

    // Session
    // =======

    createSession: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {email, password}, {dbAdapter, prisma}) {
        const user = await getUserForCredentials(email, password, prisma.user)
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {jwt}, {dbAdapter, prisma, verifyJWT}) {
        const userID = verifyJWT(jwt)

        const user = await prisma.user.findUnique({
          where: {id: userID}
        })
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        code: {type: GraphQLNonNull(GraphQLString)},
        redirectUri: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {name, code, redirectUri}, {dbAdapter, prisma, oauth2Providers}) {
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

        const user = await prisma.user.findUnique({
          where: {email: userInfo.email}
        })
        if (!user) throw new UserNotFoundError()
        if (!user.active) throw new NotActiveError()

        return await dbAdapter.session.createUserSession(user)
      }
    },

    revokeSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticateUser, prisma: {session}}) =>
        revokeSessionById(id, authenticateUser, session)
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      resolve: (root, _, {authenticateUser, prisma: {session}}) =>
        revokeSessionByToken(authenticateUser, session)
    },

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      args: {},
      resolve: (root, _, {authenticateUser, prisma: {session, userRole}}) =>
        getSessionsForUser(authenticateUser, session, userRole)
    },

    sendJWTLogin: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        url: {type: GraphQLNonNull(GraphQLString)},
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {url, email}, {authenticate, prisma, generateJWT, mailContext}) {
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        const user = await prisma.user.findUnique({
          where: {email}
        })
        if (!user) throw new NotFound('User', email)

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
        })

        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: email,
          data: {
            url: `${url}?jwt=${token}`,
            user
          }
        })

        return email
      }
    },

    sendWebsiteLogin: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {email}, {authenticate, prisma, generateJWT, mailContext, urlAdapter}) {
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        const user = await prisma.user.findUnique({
          where: {email}
        })
        if (!user) throw new NotFound('User', email)

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
        })

        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: email,
          data: {
            url: urlAdapter.getLoginURL(token),
            user
          }
        })

        return email
      }
    },

    // Token
    // =====

    createToken: {
      type: GraphQLNonNull(GraphQLCreatedToken),
      args: {input: {type: GraphQLNonNull(GraphQLTokenInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateToken, roles)

        // TODO: Receive roleIDs from input
        return dbAdapter.token.createToken({...input, roleIDs: ['peer']})
      }
    },

    deleteToken: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {token}}) =>
        deleteTokenById(id, authenticate, token)
    },

    // User
    // ====

    createUser: {
      type: GraphQLUser,
      args: {
        input: {type: GraphQLNonNull(GraphQLUserInput)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve(root, {input, password}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUser, roles)
        return dbAdapter.user.createUser({input, password})
      }
    },

    updateUser: {
      type: GraphQLUser,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUserInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUser, roles)
        return dbAdapter.user.updateUser({id, input})
      }
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        password: {type: GraphQLNonNull(GraphQLString)},
        sendMail: {type: GraphQLBoolean}
      },
      async resolve(root, {id, password, sendMail}, {authenticate, mailContext, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanResetUserPassword, roles)
        const user = await dbAdapter.user.resetUserPassword({id, password})
        if (sendMail && user) {
          await mailContext.sendMail({
            type: SendMailType.PasswordReset,
            recipient: user.email,
            data: {
              user
            }
          })
        }
        return user
      }
    },

    deleteUser: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {user}}) =>
        deleteUserById(id, authenticate, user)
    },

    // Subscriptions
    // ====

    createSubscription: {
      type: GraphQLSubscription,
      args: {
        input: {type: GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      async resolve(root, {input}, {authenticate, prisma, dbAdapter, memberContext}) {
        const {roles} = authenticate()
        authorise(CanCreateSubscription, roles)

        const subscription = await dbAdapter.subscription.createSubscription({input})
        if (!subscription) throw new Error('Subscription not created.')

        // create invoice
        const userId = subscription.userID
        const user = await prisma.user.findUnique({
          where: {id: userId}
        })
        if (!user) throw new Error('User of subscription not found.')

        // instantly create a new invoice fo the user
        await memberContext.renewSubscriptionForUser({subscription: subscription as Subscription})
        return subscription
      }
    },

    updateSubscription: {
      type: GraphQLSubscription,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      async resolve(root, {id, input}, {authenticate, prisma, dbAdapter, memberContext}) {
        const {roles} = authenticate()
        authorise(CanCreateSubscription, roles)

        const user = await prisma.user.findUnique({
          where: {
            id: input.userID
          }
        })
        if (!user) throw new Error('Can not update subscription without user')

        const updatedSubscription = await dbAdapter.subscription.updateSubscription({id, input})
        if (!updatedSubscription) throw new NotFound('subscription', id)

        return await memberContext.handleSubscriptionChange({
          subscription: updatedSubscription as Subscription
        })
      }
    },

    deleteSubscription: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {subscription}}) =>
        deleteSubscriptionById(id, authenticate, subscription)
    },

    // UserRole
    // ====

    createUserRole: {
      type: GraphQLUserRole,
      args: {input: {type: GraphQLNonNull(GraphQLUserRoleInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUserRole, roles)
        return dbAdapter.userRole.createUserRole({input})
      }
    },

    updateUserRole: {
      type: GraphQLUserRole,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUserRoleInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateUserRole, roles)
        return dbAdapter.userRole.updateUserRole({id, input})
      }
    },

    deleteUserRole: {
      type: GraphQLString,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {userRole}}) =>
        deleteUserRoleById(id, authenticate, userRole)
    },

    // Navigation
    // ==========

    createNavigation: {
      type: GraphQLNavigation,
      args: {input: {type: GraphQLNonNull(GraphQLNavigationInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateNavigation, roles)

        return dbAdapter.navigation.createNavigation({
          input: {...input, links: input.links.map(mapNavigationLinkInput)}
        })
      }
    },

    updateNavigation: {
      type: GraphQLNavigation,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLNavigationInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateNavigation, roles)

        return dbAdapter.navigation.updateNavigation({
          id,
          input: {...input, links: input.links.map(mapNavigationLinkInput)}
        })
      }
    },

    deleteNavigation: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {navigation}}) =>
        deleteNavigationById(id, authenticate, navigation)
    },

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: GraphQLNonNull(GraphQLAuthorInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateAuthor, roles)
        return dbAdapter.author.createAuthor({input})
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
        return dbAdapter.author.updateAuthor({id, input})
      }
    },

    deleteAuthor: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {author}}) =>
        deleteAuthorById(id, authenticate, author)
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: GraphQLNonNull(GraphQLUploadImageInput)}},
      async resolve(root, {input}, {authenticate, mediaAdapter, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateImage, roles)

        const {file, filename, title, description, tags, source, link, license, focalPoint} = input

        const {id, ...image} = await mediaAdapter.uploadImage(file)

        return dbAdapter.image.createImage({
          id,
          input: {
            ...image,

            filename: filename ?? image.filename,
            title,
            description,
            tags,

            source,
            link,
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
        return dbAdapter.image.updateImage({id, input})
      }
    },

    deleteImage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, mediaAdapter, prisma: {image}}) =>
        deleteImageById(id, authenticate, image, mediaAdapter)
    },

    // Article
    // =======

    createArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {input: {type: GraphQLNonNull(GraphQLArticleInput)}},
      async resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateArticle, roles)

        return dbAdapter.article.createArticle({
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

        return dbAdapter.article.updateArticle({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deleteArticle: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {article}}) =>
        deleteArticleById(id, authenticate, article)
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

        return dbAdapter.article.publishArticle({
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
        return dbAdapter.article.unpublishArticle({id})
      }
    },

    duplicateArticle: {
      type: GraphQLNonNull(GraphQLArticle),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {dbAdapter, loaders}) {
        const article = await loaders.articles.load(id)

        if (!article) throw new NotFound('article', id)

        const articleRevision: ArticleRevision = Object.assign(
          {},
          article.draft ?? article.pending ?? article.published,
          {
            slug: '',
            publishedAt: undefined,
            updatedAt: undefined
          }
        )
        const output = await dbAdapter.article.createArticle({
          input: {shared: article.shared, ...articleRevision}
        })

        return output
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

        return dbAdapter.page.createPage({
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

        return dbAdapter.page.updatePage({
          id,
          input: {...input, blocks: input.blocks.map(mapBlockUnionMap)}
        })
      }
    },

    deletePage: {
      type: GraphQLBoolean,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {page}}) =>
        deletePageById(id, authenticate, page)
    },

    publishPage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      async resolve(
        root,
        {id, publishAt, updatedAt, publishedAt},
        {authenticate, dbAdapter, loaders}
      ) {
        const {roles} = authenticate()
        authorise(CanPublishPage, roles)

        const page = await loaders.pages.load(id)

        if (!page) throw new NotFound('page', id)
        if (!page.draft) return null

        const publishedPage = await loaders.publicPagesBySlug.load(page.draft.slug)
        if (publishedPage && publishedPage.id !== id)
          throw new DuplicatePageSlugError(publishedPage.id, publishedPage.slug)

        return dbAdapter.page.publishPage({
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
        return dbAdapter.page.unpublishPage({id})
      }
    },

    duplicatePage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {dbAdapter, loaders}) {
        const page = await loaders.pages.load(id)

        if (!page) throw new NotFound('page', id)

        const pageRevision: PageRevision = Object.assign(
          {},
          page.draft ?? page.pending ?? page.published,
          {
            slug: '',
            publishedAt: undefined,
            updatedAt: undefined
          }
        )
        const output = await dbAdapter.page.createPage({input: {...pageRevision}})

        return output
      }
    },

    // MemberPlan
    // ======

    createMemberPlan: {
      type: GraphQLMemberPlan,
      args: {input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateMemberPlan, roles)

        if (input.minimumDuration < 0) {
          throw new Error('Input.minimumDuration can not be < 0')
        } else if (input.pricePerMonthMinimum > input.pricePerMonthMaximum) {
          throw new Error('Input.pricePerMonthMinimum can not be > pricePerMonthMaximum')
        }

        return dbAdapter.memberPlan.createMemberPlan({input})
      }
    },

    updateMemberPlan: {
      type: GraphQLMemberPlan,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateMemberPlan, roles)
        return dbAdapter.memberPlan.updateMemberPlan({id, input})
      }
    },

    deleteMemberPlan: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {memberPlan}}) =>
        deleteMemberPlanById(id, authenticate, memberPlan)
    },

    // PaymentMethod
    // ======

    createPaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        input: {type: GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePaymentMethod, roles)

        // TODO: check if payment method exists and is active

        return dbAdapter.paymentMethod.createPaymentMethod({input})
      }
    },

    updatePaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePaymentMethod, roles)

        // TODO: check if payment method exists and is active

        return dbAdapter.paymentMethod.updatePaymentMethod({id, input})
      }
    },

    deletePaymentMethod: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {paymentMethod}}) =>
        deletePaymentMethodById(id, authenticate, paymentMethod)
    },

    // Invoice
    // ======

    createInvoice: {
      type: GraphQLInvoice,
      args: {input: {type: GraphQLNonNull(GraphQLInvoiceInput)}},
      resolve(root, {input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateInvoice, roles)
        return dbAdapter.invoice.createInvoice({input})
      }
    },

    createPaymentFromInvoice: {
      type: GraphQLPayment,
      args: {input: {type: GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}},
      async resolve(root, {input}, {authenticate, loaders, paymentProviders, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreatePayment, roles)
        const {invoiceID, paymentMethodID, successURL, failureURL} = input
        const paymentMethod = await loaders.paymentMethodsByID.load(paymentMethodID)
        const paymentProvider = paymentProviders.find(
          pp => pp.id === paymentMethod?.paymentProviderID
        )

        const invoice = await loaders.invoicesByID.load(invoiceID)

        if (!invoice || !paymentProvider) {
          throw new Error('Invalid data') // TODO: better error handling
        }

        const payment = await dbAdapter.payment.createPayment({
          input: {
            paymentMethodID,
            invoiceID,
            state: PaymentState.Created
          }
        })

        const intent = await paymentProvider.createIntent({
          paymentID: payment.id,
          invoice,
          saveCustomer: true,
          successURL,
          failureURL
        })

        return await dbAdapter.payment.updatePayment({
          id: payment.id,
          input: {
            state: intent.state,
            intentID: intent.intentID,
            intentData: intent.intentData,
            intentSecret: intent.intentSecret,
            paymentData: intent.paymentData,
            paymentMethodID: payment.paymentMethodID,
            invoiceID: payment.invoiceID
          }
        })
      }
    },

    updateInvoice: {
      type: GraphQLInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLInvoiceInput)}
      },
      resolve(root, {id, input}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanCreateInvoice, roles)
        return dbAdapter.invoice.updateInvoice({id, input})
      }
    },

    deleteInvoice: {
      type: GraphQLID,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {invoice}}) =>
        deleteInvoiceById(id, authenticate, invoice)
    },

    approveComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.Approved
        })
      }
    },

    rejectComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      async resolve(root, {id, rejectionReason}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.Rejected,
          rejectionReason
        })
      }
    },

    requestChangesOnComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      async resolve(root, {id, rejectionReason}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanTakeActionOnComment, roles)

        return await dbAdapter.comment.takeActionOnComment({
          id,
          state: CommentState.PendingUserChanges,
          rejectionReason
        })
      }
    }
    // Image
    // =====
  }
})
