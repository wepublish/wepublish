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
import {Context} from '../context'
import {Block, BlockMap, BlockType} from '../db/block'
import {CommentState} from '../db/comment'
import {DuplicatePageSlugError, NotFound} from '../error'
import {SendMailType} from '../mails/mailContext'
import {GraphQLArticle, GraphQLArticleInput} from './article'
import {
  createArticle,
  deleteArticleById,
  duplicateArticle
} from './article/article.private-mutation'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {createAuthor, deleteAuthorById, updateAuthor} from './author/author.private-mutation'
import {GraphQLBlockInput, GraphQLTeaserInput} from './blocks'
import {GraphQLComment, GraphQLCommentRejectionReason} from './comment'
import {GraphQLImage, GraphQLUpdateImageInput, GraphQLUploadImageInput} from './image'
import {createImage, deleteImageById, updateImage} from './image/image.private-mutation'
import {GraphQLInvoice, GraphQLInvoiceInput} from './invoice'
import {createInvoice, deleteInvoiceById, updateInvoice} from './invoice/invoice.private-mutation'
import {
  createMemberPlan,
  deleteMemberPlanById,
  updateMemberPlan
} from './member-plan/member-plan.private-mutation'
import {GraphQLMemberPlan, GraphQLMemberPlanInput} from './memberPlan'
import {GraphQLNavigation, GraphQLNavigationInput, GraphQLNavigationLinkInput} from './navigation'
import {
  createNavigation,
  deleteNavigationById,
  updateNavigation
} from './navigation/navigation.private-mutation'
import {GraphQLPage, GraphQLPageInput} from './page'
import {createPage, deletePageById, duplicatePage} from './page/page.private-mutation'
import {GraphQLPayment, GraphQLPaymentFromInvoiceInput} from './payment'
import {
  createPaymentMethod,
  deletePaymentMethodById,
  updatePaymentMethod
} from './payment-method/payment-method.private-mutation'
import {createPaymentFromInvoice} from './payment/payment.private-mutation'
import {GraphQLPaymentMethod, GraphQLPaymentMethodInput} from './paymentMethod'
import {
  GraphQLCreatePeerInput,
  GraphQLPeer,
  GraphQLPeerProfile,
  GraphQLPeerProfileInput,
  GraphQLUpdatePeerInput
} from './peer'
import {createPeer, deletePeerById} from './peer/peer.private-mutation'
import {
  authorise,
  CanCreateArticle,
  CanCreatePage,
  CanCreatePeer,
  CanCreateSubscription,
  CanCreateUser,
  CanPublishArticle,
  CanPublishPage,
  CanResetUserPassword,
  CanSendJWTLogin,
  CanTakeActionOnComment,
  CanUpdatePeerProfile
} from './permissions'
import {GraphQLSession, GraphQLSessionWithToken} from './session'
import {
  createJWTSession,
  createOAuth2Session,
  createSession,
  revokeSessionByToken
} from './session/session.mutation'
import {revokeSessionById} from './session/session.private-mutation'
import {getSessionsForUser} from './session/session.private-queries'
import {GraphQLSubscription, GraphQLSubscriptionInput} from './subscription'
import {
  createSubscription,
  deleteSubscriptionById
} from './subscription/subscription.private-mutation'
import {GraphQLCreatedToken, GraphQLTokenInput} from './token'
import {createToken, deleteTokenById} from './token/token.private-mutation'
import {GraphQLUser, GraphQLUserInput} from './user'
import {
  createUserRole,
  deleteUserRoleById,
  updateUserRole
} from './user-role/user-role.private-mutation'
import {createAdminUser, deleteUserById} from './user/user.private-mutation'
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
      resolve: (root, {input}, {authenticate, prisma: {peer}}) =>
        createPeer(input, authenticate, peer)
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
      resolve: (root, {email, password}, {sessionTTL, prisma}) =>
        createSession(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {jwt}, {sessionTTL, prisma, verifyJWT}) =>
        createJWTSession(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        code: {type: GraphQLNonNull(GraphQLString)},
        redirectUri: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {name, code, redirectUri}, {sessionTTL, prisma, oauth2Providers}) =>
        createOAuth2Session(
          name,
          code,
          redirectUri,
          sessionTTL,
          oauth2Providers,
          prisma.session,
          prisma.user,
          prisma.userRole
        )
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
          where: {email: email}
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
      resolve: (root, {input}, {authenticate, prisma: {token}}) =>
        createToken({...input, roleIDs: ['peer']}, authenticate, token)
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
      resolve: (root, {input, password}, {hashCostFactor, authenticate, prisma: {user}}) =>
        createAdminUser({...input, password}, authenticate, hashCostFactor, user)
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
      resolve: (root, {input}, {authenticate, prisma: {subscription}, memberContext}) =>
        createSubscription(input, authenticate, memberContext, subscription)
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
      resolve: (root, {input}, {authenticate, prisma: {userRole}}) =>
        createUserRole(input, authenticate, userRole)
    },

    updateUserRole: {
      type: GraphQLUserRole,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUserRoleInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {userRole}}) =>
        updateUserRole(id, input, authenticate, userRole)
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
      resolve: (root, {input}, {authenticate, prisma: {navigation}}) =>
        createNavigation(
          {
            ...input,
            links: input.links.map(mapNavigationLinkInput)
          },
          authenticate,
          navigation
        )
    },

    updateNavigation: {
      type: GraphQLNavigation,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLNavigationInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {navigation}}) =>
        updateNavigation(
          id,
          {...input, links: input.links.map(mapNavigationLinkInput)},
          authenticate,
          navigation
        )
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
      resolve: (root, {input}, {authenticate, prisma: {author}}) =>
        createAuthor(input, authenticate, author)
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLAuthorInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {author}}) =>
        updateAuthor(id, input, authenticate, author)
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
      resolve: (root, {input}, {authenticate, mediaAdapter, prisma: {image}}) =>
        createImage(input, authenticate, mediaAdapter, image)
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLUpdateImageInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {image}}) =>
        updateImage(id, input, authenticate, image)
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
      resolve: (root, {input}, {authenticate, prisma: {article}}) =>
        createArticle({...input, blocks: input.blocks.map(mapBlockUnionMap)}, authenticate, article)
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
      resolve: (root, {id}, {authenticate, prisma: {article}, loaders: {articles}}) =>
        duplicateArticle(id, authenticate, articles, article)
    },

    // Page
    // =======

    createPage: {
      type: GraphQLNonNull(GraphQLPage),
      args: {input: {type: GraphQLNonNull(GraphQLPageInput)}},
      resolve: (root, {input}, {authenticate, prisma: {page}}) =>
        createPage({...input, blocks: input.blocks.map(mapBlockUnionMap)}, authenticate, page)
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
      resolve: (root, {id}, {prisma: {page}, loaders: {pages}, authenticate}) =>
        duplicatePage(id, authenticate, pages, page)
    },

    // MemberPlan
    // ======

    createMemberPlan: {
      type: GraphQLMemberPlan,
      args: {input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}},
      resolve: (root, {input}, {authenticate, prisma: {memberPlan}}) =>
        createMemberPlan(input, authenticate, memberPlan)
    },

    updateMemberPlan: {
      type: GraphQLMemberPlan,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLMemberPlanInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {memberPlan}}) =>
        updateMemberPlan(id, input, authenticate, memberPlan)
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
      resolve: (root, {input}, {authenticate, prisma: {paymentMethod}}) =>
        createPaymentMethod(input, authenticate, paymentMethod)
    },

    updatePaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {paymentMethod}}) =>
        updatePaymentMethod(id, input, authenticate, paymentMethod)
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
      resolve: (root, {input}, {authenticate, prisma: {invoice}}) =>
        createInvoice(input, authenticate, invoice)
    },

    createPaymentFromInvoice: {
      type: GraphQLPayment,
      args: {input: {type: GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}},
      resolve: (root, {input}, {authenticate, loaders, paymentProviders, prisma: {payment}}) =>
        createPaymentFromInvoice(
          input,
          authenticate,
          paymentProviders,
          loaders.invoicesByID,
          loaders.paymentMethodsByID,
          payment
        )
    },

    updateInvoice: {
      type: GraphQLInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLInvoiceInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {invoice}}) =>
        updateInvoice(id, input, authenticate, invoice)
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
