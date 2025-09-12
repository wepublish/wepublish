import {CommentState, RatingSystemType, UserEvent} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../context'
import {SettingName} from '@wepublish/settings/api'
import {unselectPassword} from '@wepublish/authentication/api'
import {NotFound} from '../error'
import {Validator} from '../validator'
import {GraphQLAuthor, GraphQLAuthorInput} from './author'
import {createAuthor, deleteAuthorById, updateAuthor} from './author/author.private-mutation'
import {
  GraphQLComment,
  GraphQLCommentItemType,
  GraphQLCommentRatingOverrideUpdateInput,
  GraphQLCommentRejectionReason,
  GraphQLCommentRevisionUpdateInput
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
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  importSubscription,
  renewSubscription,
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

import {CanSendJWTLogin} from '@wepublish/permissions'
import {mailLogType} from '@wepublish/mail/api'
import {GraphQLSubscriptionDeactivationReason} from './subscriptionDeactivation'

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      args: {input: {type: new GraphQLNonNull(GraphQLPeerProfileInput)}},
      resolve: (root, {input}, {hostURL, authenticate, prisma: {peerProfile}}) =>
        upsertPeerProfile(input, hostURL, authenticate, peerProfile)
    },

    createPeer: {
      type: new GraphQLNonNull(GraphQLPeer),
      args: {input: {type: new GraphQLNonNull(GraphQLCreatePeerInput)}},
      resolve: (root, {input}, {authenticate, prisma: {peer}}) =>
        createPeer(input, authenticate, peer)
    },

    updatePeer: {
      type: new GraphQLNonNull(GraphQLPeer),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLUpdatePeerInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {peer}}) =>
        updatePeer(id, input, authenticate, peer)
    },

    deletePeer: {
      type: GraphQLPeer,
      args: {id: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {id}, {authenticate, prisma: {peer}}) =>
        deletePeerById(id, authenticate, peer)
    },

    // Session
    // =======

    createSession: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: {type: new GraphQLNonNull(GraphQLString)},
        password: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {email, password}, {sessionTTL, prisma}) =>
        createSession(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithJWT: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {jwt}, {sessionTTL, prisma, verifyJWT}) =>
        createJWTSession(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithOAuth2Code: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        code: {type: new GraphQLNonNull(GraphQLString)},
        redirectUri: {type: new GraphQLNonNull(GraphQLString)}
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
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {id: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {id}, {authenticateUser, prisma: {session}}) =>
        revokeSessionById(id, authenticateUser, session)
    },

    revokeActiveSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {},
      resolve: (root, _, {authenticateUser, prisma: {session}}) =>
        revokeSessionByToken(authenticateUser, session)
    },

    sessions: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLSession))),
      args: {},
      resolve: (root, _, {authenticateUser, prisma: {session, userRole}}) =>
        getSessionsForUser(authenticateUser, session, userRole)
    },

    sendJWTLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        url: {type: new GraphQLNonNull(GraphQLString)},
        email: {type: new GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {url, email}, {authenticate, prisma, generateJWT, mailContext}) {
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        email = email.toLowerCase()
        await Validator.login.parse({email})

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
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '')

        if (!jwtExpires) {
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')
        }

        const remoteTemplate = await mailContext.getUserTemplateName(UserEvent.LOGIN_LINK)
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow
        })
        return email
      }
    },

    sendWebsiteLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        email: {type: new GraphQLNonNull(GraphQLString)}
      },
      async resolve(
        root,
        {url, email},
        {authenticate, prisma, generateJWT, mailContext, urlAdapter}
      ) {
        email = email.toLowerCase()
        await Validator.login.parse({email})
        const {roles} = authenticate()
        authorise(CanSendJWTLogin, roles)

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: {name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN}
        })
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '')

        if (!jwtExpires) throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN')

        const user = await prisma.user.findUnique({
          where: {email},
          select: unselectPassword
        })

        if (!user) throw new NotFound('User', email)

        const remoteTemplate = await mailContext.getUserTemplateName(UserEvent.LOGIN_LINK)
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow
        })

        return email
      }
    },

    // Token
    // =====

    createToken: {
      type: new GraphQLNonNull(GraphQLCreatedToken),
      args: {input: {type: new GraphQLNonNull(GraphQLTokenInput)}},
      resolve: (root, {input}, {authenticate, prisma: {token}}) =>
        createToken({...input, roleIDs: ['peer']}, authenticate, token)
    },

    deleteToken: {
      type: GraphQLCreatedToken,
      args: {id: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {id}, {authenticate, prisma: {token}}) =>
        deleteTokenById(id, authenticate, token)
    },

    // User
    // ====

    createUser: {
      type: GraphQLUser,
      args: {
        input: {type: new GraphQLNonNull(GraphQLUserInput)},
        password: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {input, password}, {hashCostFactor, authenticate, prisma, mailContext}) =>
        createAdminUser({...input, password}, authenticate, hashCostFactor, prisma, mailContext)
    },

    updateUser: {
      type: GraphQLUser,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLUserInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {user}}) =>
        updateAdminUser(id, input, authenticate, user)
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        password: {type: new GraphQLNonNull(GraphQLString)},
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
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {user}}) =>
        deleteUserById(id, authenticate, user)
    },

    // Subscriptions
    // ====

    createSubscription: {
      type: GraphQLSubscription,
      args: {
        input: {type: new GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      resolve: (root, {input}, {authenticate, prisma, memberContext}) =>
        createSubscription(input, authenticate, memberContext, prisma)
    },

    importSubscription: {
      type: GraphQLSubscription,
      args: {
        input: {type: new GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      resolve: (root, {input}, {authenticate, prisma, memberContext}) =>
        importSubscription(input, authenticate, memberContext, prisma)
    },

    renewSubscription: {
      type: GraphQLInvoice,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {subscription, invoice}, memberContext}) =>
        renewSubscription(id, authenticate, subscription, invoice, memberContext)
    },

    updateSubscription: {
      type: GraphQLSubscription,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLSubscriptionInput)}
      },
      resolve: (
        root,
        {id, input},
        {authenticate, prisma, memberContext, paymentProviders, loaders}
      ) =>
        updateAdminSubscription(
          id,
          input,
          authenticate,
          memberContext,
          loaders,
          prisma.subscription,
          prisma.user,
          paymentProviders,
          prisma.memberPlan
        )
    },

    deleteSubscription: {
      type: GraphQLSubscription,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {subscription}}) =>
        deleteSubscriptionById(id, authenticate, subscription)
    },

    cancelSubscription: {
      type: GraphQLSubscription,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        reason: {type: new GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
      },
      resolve: (root, {id, reason}, {authenticate, prisma: {subscription}, memberContext}) =>
        cancelSubscriptionById(id, reason, authenticate, subscription, memberContext)
    },

    // UserRole
    // ====

    createUserRole: {
      type: GraphQLUserRole,
      args: {input: {type: new GraphQLNonNull(GraphQLUserRoleInput)}},
      resolve: (root, {input}, {authenticate, prisma: {userRole}}) =>
        createUserRole(input, authenticate, userRole)
    },

    updateUserRole: {
      type: GraphQLUserRole,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLUserRoleInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {userRole}}) =>
        updateUserRole(id, input, authenticate, userRole)
    },

    deleteUserRole: {
      type: GraphQLUserRole,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {userRole}}) =>
        deleteUserRoleById(id, authenticate, userRole)
    },

    // Author
    // ======

    createAuthor: {
      type: GraphQLAuthor,
      args: {input: {type: new GraphQLNonNull(GraphQLAuthorInput)}},
      resolve: (root, {input}, {authenticate, prisma: {author}}) =>
        createAuthor(input, authenticate, author)
    },

    updateAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLAuthorInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {author}}) =>
        updateAuthor(id, input, authenticate, author)
    },

    deleteAuthor: {
      type: GraphQLAuthor,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {author}}) =>
        deleteAuthorById(id, authenticate, author)
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: {input: {type: new GraphQLNonNull(GraphQLUploadImageInput)}},
      resolve: (root, {input}, {authenticate, mediaAdapter, prisma: {image}}) =>
        createImage(input, authenticate, mediaAdapter, image)
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLUpdateImageInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {image}}) =>
        updateImage(id, input, authenticate, image)
    },

    deleteImage: {
      type: GraphQLImage,
      args: {id: {type: new GraphQLNonNull(GraphQLString)}},
      resolve: (root, {id}, {authenticate, mediaAdapter, prisma: {image}}) =>
        deleteImageById(id, authenticate, image, mediaAdapter)
    },

    // MemberPlan
    // ======

    createMemberPlan: {
      type: GraphQLMemberPlan,
      args: {input: {type: new GraphQLNonNull(GraphQLMemberPlanInput)}},
      resolve: (root, {input}, {authenticate, prisma: {memberPlan}}) =>
        createMemberPlan(input, authenticate, memberPlan)
    },

    updateMemberPlan: {
      type: GraphQLMemberPlan,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLMemberPlanInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {memberPlan}}) =>
        updateMemberPlan(id, input, authenticate, memberPlan)
    },

    deleteMemberPlan: {
      type: GraphQLMemberPlan,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {memberPlan}}) =>
        deleteMemberPlanById(id, authenticate, memberPlan)
    },

    // PaymentMethod
    // ======

    createPaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        input: {type: new GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve: (root, {input}, {authenticate, prisma: {paymentMethod}}) =>
        createPaymentMethod(input, authenticate, paymentMethod)
    },

    updatePaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLPaymentMethodInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {paymentMethod}}) =>
        updatePaymentMethod(id, input, authenticate, paymentMethod)
    },

    deletePaymentMethod: {
      type: GraphQLPaymentMethod,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {paymentMethod}}) =>
        deletePaymentMethodById(id, authenticate, paymentMethod)
    },

    // Invoice
    // ======

    createInvoice: {
      type: GraphQLInvoice,
      args: {input: {type: new GraphQLNonNull(GraphQLInvoiceInput)}},
      resolve: (root, {input}, {authenticate, prisma: {invoice}}) =>
        createInvoice(input, authenticate, invoice)
    },

    createPaymentFromInvoice: {
      type: GraphQLPayment,
      args: {input: {type: new GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}},
      resolve: (
        root,
        {input},
        {authenticate, loaders, paymentProviders, prisma: {payment, memberPlan, subscription}}
      ) =>
        createPaymentFromInvoice(
          input,
          authenticate,
          paymentProviders,
          loaders.invoicesByID,
          loaders.paymentMethodsByID,
          memberPlan,
          payment,
          subscription
        )
    },

    updateInvoice: {
      type: GraphQLInvoice,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        input: {type: new GraphQLNonNull(GraphQLInvoiceInput)}
      },
      resolve: (root, {id, input}, {authenticate, prisma: {invoice}}) =>
        updateInvoice(id, input, authenticate, invoice)
    },

    deleteInvoice: {
      type: GraphQLInvoice,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {invoice}}) =>
        deleteInvoiceById(id, authenticate, invoice)
    },

    markInvoiceAsPaid: {
      type: GraphQLInvoice,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma, authenticateUser}) =>
        markInvoiceAsPaid(id, authenticate, authenticateUser, prisma)
    },

    // Comment
    // ======
    updateComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        revision: {type: GraphQLCommentRevisionUpdateInput},
        userID: {type: GraphQLString},
        guestUsername: {type: GraphQLString},
        guestUserImageID: {type: GraphQLString},
        featured: {type: GraphQLBoolean},
        source: {type: GraphQLString},
        tagIds: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
        ratingOverrides: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLCommentRatingOverrideUpdateInput))
        }
      },
      resolve: (
        root,
        {
          id,
          revision,
          ratingOverrides,
          userID,
          guestUsername,
          guestUserImageID,
          featured,
          source,
          tagIds
        },
        {authenticate, prisma: {comment, commentRatingSystemAnswer}}
      ) =>
        updateComment(
          id,
          revision,
          userID,
          guestUsername,
          guestUserImageID,
          source,
          featured,
          tagIds,
          ratingOverrides,
          authenticate,
          commentRatingSystemAnswer,
          comment
        )
    },

    createComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        text: {type: GraphQLRichText},
        tagIds: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
        itemID: {type: new GraphQLNonNull(GraphQLString)},
        parentID: {type: GraphQLString},
        itemType: {
          type: new GraphQLNonNull(GraphQLCommentItemType)
        }
      },
      resolve: (
        root,
        {text, tagIds, itemID, itemType, parentID},
        {authenticate, prisma: {comment}}
      ) => createAdminComment(itemID, itemType, parentID, text, tagIds, authenticate, comment)
    },

    approveComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {comment}}) =>
        takeActionOnComment(id, {state: CommentState.approved}, authenticate, comment)
    },

    rejectComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
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
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        rejectionReason: {type: new GraphQLNonNull(GraphQLCommentRejectionReason)}
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
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {comment}}) =>
        deleteComment(id, authenticate, comment)
    },

    // Settings
    // ==========

    updateSettingList: {
      type: new GraphQLList(GraphQLSetting),
      args: {
        value: {type: new GraphQLList(GraphQLUpdateSettingArgs)}
      },
      resolve: (root, {value}, {authenticate, prisma}) =>
        updateSettings(value, authenticate, prisma)
    },

    // Rating System
    // ==========

    createRatingSystemAnswer: {
      type: new GraphQLNonNull(GraphQLCommentRatingSystemAnswer),
      args: {
        ratingSystemId: {type: new GraphQLNonNull(GraphQLString)},
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
      type: new GraphQLNonNull(GraphQLFullCommentRatingSystem),
      args: {
        ratingSystemId: {type: new GraphQLNonNull(GraphQLString)},
        name: {type: GraphQLString},
        answers: {type: new GraphQLList(new GraphQLNonNull(GraphQLUpdateCommentRatingSystemAnswer))}
      },
      resolve: (
        root,
        {ratingSystemId, answers, name},
        {authenticate, prisma: {commentRatingSystem}}
      ) => updateRatingSystem(ratingSystemId, name, answers, authenticate, commentRatingSystem)
    },

    deleteRatingSystemAnswer: {
      type: new GraphQLNonNull(GraphQLCommentRatingSystemAnswer),
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
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
        pollId: {type: new GraphQLNonNull(GraphQLString)},
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
        pollId: {type: new GraphQLNonNull(GraphQLString)},
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
        pollId: {type: new GraphQLNonNull(GraphQLString)},
        opensAt: {type: GraphQLDateTime},
        closedAt: {type: GraphQLDateTime},
        question: {type: GraphQLString},
        infoText: {type: GraphQLRichText},
        answers: {type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollAnswer))},
        externalVoteSources: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollExternalVoteSources))
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
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {poll}}) => deletePoll(id, authenticate, poll)
    },

    deletePollAnswer: {
      type: GraphQLPollAnswerWithVoteCount,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {pollAnswer}}) =>
        deletePollAnswer(id, authenticate, pollAnswer)
    },

    deletePollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
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
        type: {type: new GraphQLNonNull(GraphQLTagType)},
        main: {type: GraphQLBoolean}
      },
      resolve: (root, {tag, type, main}, {authenticate, prisma}) =>
        createTag(tag, type, main, authenticate, prisma.tag)
    },

    updateTag: {
      type: GraphQLTag,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        tag: {type: GraphQLString},
        main: {type: GraphQLBoolean}
      },
      resolve: (root, {id, tag, main}, {authenticate, prisma}) =>
        updateTag(id, tag, main, authenticate, prisma.tag)
    },

    deleteTag: {
      type: GraphQLTag,
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {id}, {authenticate, prisma: {tag}}) => deleteTag(id, authenticate, tag)
    }
  }
})
