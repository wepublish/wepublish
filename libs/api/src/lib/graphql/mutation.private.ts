import {CommentState, Prisma, RatingSystemType} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../context'
import {Block, BlockMap, BlockType} from '../db/block'
import {SettingName} from '@wepublish/settings/api'
import {unselectPassword} from '@wepublish/user/api'
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
  GraphQLCommentRejectionReason,
  GraphQLCommentItemType,
  GraphQLCommentRevisionUpdateInput,
  GraphQLCommentRatingOverrideUpdateInput
} from './comment/comment'
import {
  GraphQLCommentRatingSystemAnswer,
  GraphQLFullCommentRatingSystem,
  GraphQLRatingSystemType,
  GraphQLUpdateCommentRatingSystemAnswer
} from './comment-rating/comment-rating'
import {
  createCommentRatingAnswer,
  deleteCommentRatingAnswer,
  updateRatingSystem
} from './comment-rating/comment-rating.private-mutation'

import {
  createAdminComment,
  deleteComment,
  takeActionOnComment,
  updateComment
} from './comment/comment.private-mutation'
import {GraphQLImage, GraphQLUpdateImageInput, GraphQLUploadImageInput} from './image'
import {createImage, deleteImageById, updateImage} from './image/image.private-mutation'
import {GraphQLInvoice, GraphQLInvoiceInput} from './invoice'
import {
  createInvoice,
  deleteInvoiceById,
  markInvoiceAsPaid,
  updateInvoice
} from './invoice/invoice.private-mutation'
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
import {authorise} from './permissions'
import {
  GraphQLFullPoll,
  GraphQLPollAnswer,
  GraphQLPollAnswerWithVoteCount,
  GraphQLPollExternalVoteSource,
  GraphQLPollWithAnswers,
  GraphQLUpdatePollAnswer,
  GraphQLUpdatePollExternalVoteSources
} from './poll/poll'
import {
  createPoll,
  createPollAnswer,
  createPollExternalVoteSource,
  deletePoll,
  deletePollAnswer,
  deletePollExternalVoteSource,
  updatePoll
} from './poll/poll.private-mutation'
import {GraphQLRichText} from '@wepublish/richtext/api'
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
import {GraphQLEvent, GraphQLEventStatus} from './event/event'
import {
  createEvent,
  deleteEvent,
  updateEvent,
  UpdateOrCreateEventInput
} from './event/event.private-mutation'
import {CanSendJWTLogin} from '@wepublish/permissions/api'

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
        await Validator.login().parse({email})

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
        await Validator.login().parse({email})
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
      resolve: (root, {id, publishAt, updatedAt, publishedAt}, {authenticate, prisma}) =>
        publishArticle(id, {publishAt, updatedAt, publishedAt}, authenticate, prisma)
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

    markInvoiceAsPaid: {
      type: GraphQLInvoice,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma, authenticateUser}) =>
        markInvoiceAsPaid(id, authenticate, authenticateUser, prisma)
    },

    // Comment
    // ======
    updateComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        revision: {type: GraphQLCommentRevisionUpdateInput},
        userID: {type: GraphQLID},
        guestUsername: {type: GraphQLString},
        guestUserImageID: {type: GraphQLID},
        source: {type: GraphQLString},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
        ratingOverrides: {
          type: GraphQLList(GraphQLNonNull(GraphQLCommentRatingOverrideUpdateInput))
        }
      },
      resolve: (
        root,
        {id, revision, ratingOverrides, userID, guestUsername, guestUserImageID, source, tagIds},
        {authenticate, prisma: {comment, commentRatingSystemAnswer}}
      ) =>
        updateComment(
          id,
          revision,
          userID,
          guestUsername,
          guestUserImageID,
          source,
          tagIds,
          ratingOverrides,
          authenticate,
          commentRatingSystemAnswer,
          comment
        )
    },

    createComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        text: {type: GraphQLRichText},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
        itemID: {type: GraphQLNonNull(GraphQLID)},
        parentID: {type: GraphQLID},
        itemType: {
          type: GraphQLNonNull(GraphQLCommentItemType)
        }
      },
      resolve: (
        root,
        {text, tagIds, itemID, itemType, parentID},
        {authenticate, prisma: {comment}}
      ) => createAdminComment(itemID, itemType, parentID, text, tagIds, authenticate, comment)
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
        rejectionReason: {type: GraphQLCommentRejectionReason}
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

    deleteComment: {
      type: GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {comment}}) =>
        deleteComment(id, authenticate, comment)
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

    // Rating System
    // ==========

    createRatingSystemAnswer: {
      type: GraphQLNonNull(GraphQLCommentRatingSystemAnswer),
      args: {
        ratingSystemId: {type: GraphQLNonNull(GraphQLID)},
        type: {type: GraphQLRatingSystemType, defaultValue: RatingSystemType.star},
        answer: {type: GraphQLString}
      },
      resolve: (
        root,
        {ratingSystemId, type, answer},
        {authenticate, prisma: {commentRatingSystemAnswer}}
      ) =>
        createCommentRatingAnswer(
          ratingSystemId,
          type,
          answer,
          authenticate,
          commentRatingSystemAnswer
        )
    },

    updateRatingSystem: {
      type: GraphQLNonNull(GraphQLFullCommentRatingSystem),
      args: {
        ratingSystemId: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLString},
        answers: {type: GraphQLList(GraphQLNonNull(GraphQLUpdateCommentRatingSystemAnswer))}
      },
      resolve: (
        root,
        {ratingSystemId, answers, name},
        {authenticate, prisma: {commentRatingSystem}}
      ) => updateRatingSystem(ratingSystemId, name, answers, authenticate, commentRatingSystem)
    },

    deleteRatingSystemAnswer: {
      type: GraphQLNonNull(GraphQLCommentRatingSystemAnswer),
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {commentRatingSystemAnswer}}) =>
        deleteCommentRatingAnswer(id, authenticate, commentRatingSystemAnswer)
    },

    // Poll
    // ==========

    createPoll: {
      type: GraphQLPollWithAnswers,
      args: {
        opensAt: {type: GraphQLDateTime},
        closedAt: {type: GraphQLDateTime},
        question: {type: GraphQLString}
      },
      resolve: (root, input, {authenticate, prisma: {poll}}) =>
        createPoll(input, authenticate, poll)
    },

    createPollAnswer: {
      type: GraphQLPollAnswer,
      args: {
        pollId: {type: GraphQLNonNull(GraphQLID)},
        answer: {type: GraphQLString}
      },
      resolve: (
        root,
        {pollId, answer},
        {authenticate, prisma: {pollExternalVoteSource, pollAnswer}}
      ) => createPollAnswer(pollId, answer, authenticate, pollExternalVoteSource, pollAnswer)
    },

    createPollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        pollId: {type: GraphQLNonNull(GraphQLID)},
        source: {type: GraphQLString}
      },
      resolve: (
        root,
        {pollId, source},
        {authenticate, prisma: {pollExternalVoteSource, pollAnswer}}
      ) =>
        createPollExternalVoteSource(
          pollId,
          source,
          authenticate,
          pollAnswer,
          pollExternalVoteSource
        )
    },

    updatePoll: {
      type: GraphQLFullPoll,
      args: {
        pollId: {type: GraphQLNonNull(GraphQLID)},
        opensAt: {type: GraphQLDateTime},
        closedAt: {type: GraphQLDateTime},
        question: {type: GraphQLString},
        infoText: {type: GraphQLRichText},
        answers: {type: GraphQLList(GraphQLNonNull(GraphQLUpdatePollAnswer))},
        externalVoteSources: {
          type: GraphQLList(GraphQLNonNull(GraphQLUpdatePollExternalVoteSources))
        }
      },
      resolve: (
        root,
        {pollId, answers, externalVoteSources, ...pollInput},
        {authenticate, prisma: {poll}}
      ) => updatePoll(pollId, pollInput, answers, externalVoteSources, authenticate, poll)
    },

    deletePoll: {
      type: GraphQLFullPoll,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {poll}}) => deletePoll(id, authenticate, poll)
    },

    deletePollAnswer: {
      type: GraphQLPollAnswerWithVoteCount,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {pollAnswer}}) =>
        deletePollAnswer(id, authenticate, pollAnswer)
    },

    deletePollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {pollExternalVoteSource}}) =>
        deletePollExternalVoteSource(id, authenticate, pollExternalVoteSource)
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
    },

    // Event
    // ==========

    createEvent: {
      type: GraphQLEvent,
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        description: {type: GraphQLRichText},
        location: {type: GraphQLString},
        startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
        endsAt: {type: GraphQLDateTime},
        imageId: {type: GraphQLID},
        externalSourceId: {type: GraphQLString},
        externalSourceName: {type: GraphQLString},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
      },
      resolve: (root, {tagIds, ...input}, {authenticate, prisma: {event}}) =>
        createEvent(
          input as UpdateOrCreateEventInput<Prisma.EventUncheckedCreateInput>,
          tagIds,
          authenticate,
          event
        )
    },

    updateEvent: {
      type: GraphQLEvent,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLString},
        description: {type: GraphQLRichText},
        status: {type: GraphQLEventStatus},
        location: {type: GraphQLString},
        startsAt: {type: GraphQLDateTime},
        endsAt: {type: GraphQLDateTime},
        imageId: {type: GraphQLID},
        externalSourceId: {type: GraphQLString},
        externalSourceName: {type: GraphQLString},
        tagIds: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
      },
      resolve: (root, {id, tagIds, ...input}, {authenticate, prisma: {event}}) =>
        updateEvent(
          id,
          input as UpdateOrCreateEventInput<Prisma.EventUncheckedUpdateInput>,
          tagIds,
          authenticate,
          event
        )
    },

    deleteEvent: {
      type: GraphQLEvent,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {event}}) => deleteEvent(id, authenticate, event)
    }
  }
})
