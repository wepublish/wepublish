import {CommentState} from '@prisma/client'
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
import {SettingName} from '../db/setting'
import {unselectPassword} from '../db/user'
import {NotFound} from '../error'
import {SendMailType} from '../mails/mailContext'
import {Validator} from '../validator'
import {GraphQLArticle, GraphQLArticleInput} from './article'
import {
  createArticle,
  deleteArticleById,
  duplicateArticle,
  publishArticle,
  unpublishArticle,
  updateArticle
} from './article/article.private-mutation'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {createAuthor, deleteAuthorById, updateAuthor} from './author/author.private-mutation'
import {GraphQLBlockInput, GraphQLTeaserInput} from './blocks'
import {
  GraphQLComment,
  GraphQLCommentItemType,
  GraphQLCommentRejectionReason,
  GraphQLCommentRevisionUpdateInput
} from './comment/comment'
import {
  createAdminComment,
  takeActionOnComment,
  updateComment
} from './comment/comment.private-mutation'
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
import {
  createPage,
  deletePageById,
  duplicatePage,
  publishPage,
  unpublishPage,
  updatePage
} from './page/page.private-mutation'
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
import {upsertPeerProfile} from './peer-profile/peer-profile.private-mutation'
import {createPeer, deletePeerById, updatePeer} from './peer/peer.private-mutation'
import {authorise, CanSendJWTLogin} from './permissions'
import {GraphQLRichText} from './richText'
import {GraphQLSession, GraphQLSessionWithToken} from './session'
import {
  createJWTSession,
  createOAuth2Session,
  createSession,
  revokeSessionByToken
} from './session/session.mutation'
import {revokeSessionById} from './session/session.private-mutation'
import {getSessionsForUser} from './session/session.private-queries'
import {GraphQLSetting, GraphQLUpdateSettingArgs} from './setting'
import {updateSettings} from './setting/setting.private-mutation'
import {GraphQLSubscription, GraphQLSubscriptionInput} from './subscription'
import {
  createSubscription,
  deleteSubscriptionById,
  updateAdminSubscription
} from './subscription/subscription.private-mutation'
import {GraphQLTag, GraphQLTagType} from './tag/tag'
import {createTag, deleteTag, updateTag} from './tag/tag.private-mutation'
import {GraphQLCreatedToken, GraphQLTokenInput} from './token'
import {createToken, deleteTokenById} from './token/token.private-mutation'
import {GraphQLUser, GraphQLUserInput} from './user'
import {
  createUserRole,
  deleteUserRoleById,
  updateUserRole
} from './user-role/user-role.private-mutation'
import {
  createAdminUser,
  deleteUserById,
  resetUserPassword,
  updateAdminUser
} from './user/user.private-mutation'
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
      resolve: (root, {input}, {hostURL, authenticate, prisma: {peerProfile}}) =>
        upsertPeerProfile(input, hostURL, authenticate, peerProfile)
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
      resolve: (root, {id, input}, {authenticate, prisma: {peer}}) =>
        updatePeer(id, input, authenticate, peer)
    },

    deletePeer: {
      type: GraphQLPeer,
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

        email = email.toLowerCase()
        await Validator.login().validateAsync({email})

        const user = await prisma.user.findUnique({
          where: {email},
          select: unselectPassword
        })
        if (!user) throw new NotFound('User', email)

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: {name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN}
        })
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN ?? '')

        if (!jwtExpires) {
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')
        }

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: jwtExpires
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
      async resolve(
        root,
        {url, email},
        {authenticate, prisma, generateJWT, mailContext, urlAdapter}
      ) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email})
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: {name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN}
        })
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN ?? '')

        if (!jwtExpires) throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')

        const user = await prisma.user.findUnique({
          where: {email},
          select: unselectPassword
        })

        if (!user) throw new NotFound('User', email)

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: jwtExpires
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
      type: GraphQLCreatedToken,
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
      resolve: (root, {id, input}, {authenticate, prisma: {user}}) =>
        updateAdminUser(id, input, authenticate, user)
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        password: {type: GraphQLNonNull(GraphQLString)},
        sendMail: {type: GraphQLBoolean}
      },
      resolve: (
        root,
        {id, password, sendMail},
        {authenticate, mailContext, prisma: {user}, hashCostFactor}
      ) =>
        resetUserPassword(id, password, sendMail, hashCostFactor, authenticate, mailContext, user)
    },

    deleteUser: {
      type: GraphQLUser,
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
      resolve: (root, {id, input}, {authenticate, prisma, memberContext}) =>
        updateAdminSubscription(
          id,
          input,
          authenticate,
          memberContext,
          prisma.subscription,
          prisma.user
        )
    },

    deleteSubscription: {
      type: GraphQLSubscription,
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
      type: GraphQLUserRole,
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
      type: GraphQLNavigation,
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
      type: GraphQLAuthor,
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
      type: GraphQLImage,
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
      resolve: (root, {id, input}, {authenticate, prisma: {article}}) =>
        updateArticle(
          id,
          {...input, blocks: input.blocks.map(mapBlockUnionMap)},
          authenticate,
          article
        )
    },

    deleteArticle: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma}) => deleteArticleById(id, authenticate, prisma)
    },

    publishArticle: {
      type: GraphQLArticle,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      resolve: (root, {id, publishAt, updatedAt, publishedAt}, {authenticate, prisma: {article}}) =>
        publishArticle(id, {publishAt, updatedAt, publishedAt}, authenticate, article)
    },

    unpublishArticle: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {article}}) =>
        unpublishArticle(id, authenticate, article)
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
      resolve: (root, {id, input}, {authenticate, prisma: {page}}) =>
        updatePage(id, {...input, blocks: input.blocks.map(mapBlockUnionMap)}, authenticate, page)
    },

    deletePage: {
      type: GraphQLPage,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma}) => deletePageById(id, authenticate, prisma)
    },

    publishPage: {
      type: GraphQLPage,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        publishAt: {type: GraphQLDateTime},
        updatedAt: {type: GraphQLDateTime},
        publishedAt: {type: GraphQLDateTime}
      },
      resolve: (root, {id, publishAt, updatedAt, publishedAt}, {authenticate, prisma: {page}}) =>
        publishPage(id, {publishAt, updatedAt, publishedAt}, authenticate, page)
    },

    unpublishPage: {
      type: GraphQLPage,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {page}}) => unpublishPage(id, authenticate, page)
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
      type: GraphQLMemberPlan,
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
      type: GraphQLPaymentMethod,
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
      type: GraphQLInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {invoice}}) =>
        deleteInvoiceById(id, authenticate, invoice)
    },

    // Comment
    // ======

    updateComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        revision: {type: GraphQLCommentRevisionUpdateInput},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
      },
      resolve: (root, {id, revision, tagIds}, {authenticate, prisma: {comment}}) =>
        updateComment(id, revision, tagIds, authenticate, comment)
    },

    createComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        text: {type: GraphQLRichText},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
        itemID: {type: GraphQLNonNull(GraphQLID)},
        itemType: {
          type: GraphQLNonNull(GraphQLCommentItemType)
        }
      },
      resolve: (root, {text, tagIds, itemID, itemType}, {authenticate, prisma: {comment}}) =>
        createAdminComment(itemID, itemType, text, tagIds, authenticate, comment)
    },

    approveComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {comment}}) =>
        takeActionOnComment(id, {state: CommentState.approved}, authenticate, comment)
    },

    rejectComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      resolve: (root, {id, rejectionReason}, {authenticate, prisma: {comment}}) =>
        takeActionOnComment(
          id,
          {state: CommentState.rejected, rejectionReason},
          authenticate,
          comment
        )
    },

    requestChangesOnComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)}
      },
      resolve: (root, {id, rejectionReason}, {authenticate, prisma: {comment}}) =>
        takeActionOnComment(
          id,
          {state: CommentState.pendingUserChanges, rejectionReason},
          authenticate,
          comment
        )
    },

    // Settings
    // ==========

    updateSettingList: {
      type: GraphQLList(GraphQLSetting),
      args: {
        value: {type: GraphQLList(GraphQLUpdateSettingArgs)}
      },
      resolve: (root, {value}, {authenticate, prisma}) =>
        updateSettings(value, authenticate, prisma)
    },

    // Tag
    // ==========

    createTag: {
      type: GraphQLTag,
      args: {
        tag: {type: GraphQLString},
        type: {type: GraphQLNonNull(GraphQLTagType)}
      },
      resolve: (root, {tag, type}, {authenticate, prisma}) =>
        createTag(tag, type, authenticate, prisma.tag)
    },

    updateTag: {
      type: GraphQLTag,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        tag: {type: GraphQLString}
      },
      resolve: (root, {id, tag}, {authenticate, prisma}) =>
        updateTag(id, tag, authenticate, prisma.tag)
    },

    deleteTag: {
      type: GraphQLTag,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {tag}}) => deleteTag(id, authenticate, tag)
    }
  }
})
