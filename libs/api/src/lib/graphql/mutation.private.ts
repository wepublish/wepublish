import { CommentState, UserEvent } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';
import { SettingName } from '@wepublish/settings/api';
import { unselectPassword } from '@wepublish/authentication/api';
import { NotFound } from '../error';
import { Validator } from '../validator';

import {
  GraphQLComment,
  GraphQLCommentItemType,
  GraphQLCommentRatingOverrideUpdateInput,
  GraphQLCommentRejectionReason,
  GraphQLCommentRevisionUpdateInput,
} from './comment/comment';

import {
  createAdminComment,
  deleteComment,
  takeActionOnComment,
  updateComment,
} from './comment/comment.private-mutation';

import { GraphQLInvoice, GraphQLInvoiceInput } from './invoice';
import {
  createInvoice,
  deleteInvoiceById,
  markInvoiceAsPaid,
  updateInvoice,
} from './invoice/invoice.private-mutation';

import { GraphQLPayment, GraphQLPaymentFromInvoiceInput } from './payment';

import { createPaymentFromInvoice } from './payment/payment.private-mutation';

import { GraphQLPeerProfile, GraphQLPeerProfileInput } from './peer';
import { upsertPeerProfile } from './peer-profile/peer-profile.private-mutation';
import { authorise } from './permissions';
import {
  GraphQLFullPoll,
  GraphQLPollAnswer,
  GraphQLPollAnswerWithVoteCount,
  GraphQLPollExternalVoteSource,
  GraphQLPollWithAnswers,
  GraphQLUpdatePollAnswer,
  GraphQLUpdatePollExternalVoteSources,
} from './poll/poll';
import {
  createPoll,
  createPollAnswer,
  createPollExternalVoteSource,
  deletePoll,
  deletePollAnswer,
  deletePollExternalVoteSource,
  updatePoll,
} from './poll/poll.private-mutation';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { GraphQLSession, GraphQLSessionWithToken } from './session';
import {
  createJWTSession,
  createSession,
  revokeSessionByToken,
} from './session/session.mutation';
import { revokeSessionById } from './session/session.private-mutation';
import { getSessionsForUser } from './session/session.private-queries';
import { GraphQLSubscription, GraphQLSubscriptionInput } from './subscription';
import {
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  renewSubscription,
  updateAdminSubscription,
} from './subscription/subscription.private-mutation';
import { GraphQLUser, GraphQLUserInput } from './user';
import {
  createAdminUser,
  deleteUserById,
  resetUserPassword,
  updateAdminUser,
} from './user/user.private-mutation';

import { CanSendJWTLogin } from '@wepublish/permissions';
import { mailLogType } from '@wepublish/mail/api';
import { GraphQLSubscriptionDeactivationReason } from './subscriptionDeactivation';

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      args: { input: { type: new GraphQLNonNull(GraphQLPeerProfileInput) } },
      resolve: (
        root,
        { input },
        { hostURL, authenticate, prisma: { peerProfile } }
      ) => upsertPeerProfile(input, hostURL, authenticate, peerProfile),
    },

    // Session
    // =======

    createSession: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { email, password }, { sessionTTL, prisma }) =>
        createSession(
          email,
          password,
          sessionTTL,
          prisma.session,
          prisma.user,
          prisma.userRole
        ),
    },

    createSessionWithJWT: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { jwt }, { sessionTTL, prisma, verifyJWT }) =>
        createJWTSession(
          jwt,
          sessionTTL,
          verifyJWT,
          prisma.session,
          prisma.user,
          prisma.userRole
        ),
    },

    revokeSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (root, { id }, { authenticateUser, prisma: { session } }) =>
        revokeSessionById(id, authenticateUser, session),
    },

    revokeActiveSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {},
      resolve: (root, _, { authenticateUser, prisma: { session } }) =>
        revokeSessionByToken(authenticateUser, session),
    },

    sessions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLSession))
      ),
      args: {},
      resolve: (root, _, { authenticateUser, prisma: { session, userRole } }) =>
        getSessionsForUser(authenticateUser, session, userRole),
    },

    sendJWTLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        url: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(
        root,
        { url, email },
        { authenticate, prisma, generateJWT, mailContext }
      ) {
        const { roles } = authenticate();
        authorise(CanSendJWTLogin, roles);

        email = email.toLowerCase();
        await Validator.login.parse({ email });

        const user = await prisma.user.findUnique({
          where: { email },
          select: unselectPassword,
        });
        if (!user) throw new NotFound('User', email);

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        });
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '');

        if (!jwtExpires) {
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
        }

        const remoteTemplate = await mailContext.getUserTemplateName(
          UserEvent.LOGIN_LINK
        );
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow,
        });
        return email;
      },
    },

    sendWebsiteLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(
        root,
        { url, email },
        { authenticate, prisma, generateJWT, mailContext, urlAdapter }
      ) {
        email = email.toLowerCase();
        await Validator.login.parse({ email });
        const { roles } = authenticate();
        authorise(CanSendJWTLogin, roles);

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        });
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '');

        if (!jwtExpires)
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');

        const user = await prisma.user.findUnique({
          where: { email },
          select: unselectPassword,
        });

        if (!user) throw new NotFound('User', email);

        const remoteTemplate = await mailContext.getUserTemplateName(
          UserEvent.LOGIN_LINK
        );
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow,
        });

        return email;
      },
    },

    // User
    // ====

    createUser: {
      type: GraphQLUser,
      args: {
        input: { type: new GraphQLNonNull(GraphQLUserInput) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { input, password },
        { hashCostFactor, authenticate, prisma, mailContext }
      ) =>
        createAdminUser(
          { ...input, password },
          authenticate,
          hashCostFactor,
          prisma,
          mailContext
        ),
    },

    updateUser: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLUserInput) },
      },
      resolve: (root, { id, input }, { authenticate, prisma: { user } }) =>
        updateAdminUser(id, input, authenticate, user),
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        sendMail: { type: GraphQLBoolean },
      },
      resolve: (
        root,
        { id, password, sendMail },
        { authenticate, mailContext, prisma: { user }, hashCostFactor }
      ) =>
        resetUserPassword(
          id,
          password,
          sendMail,
          hashCostFactor,
          authenticate,
          mailContext,
          user
        ),
    },

    deleteUser: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { user } }) =>
        deleteUserById(id, authenticate, user),
    },

    // Subscriptions
    // ====

    createSubscription: {
      type: GraphQLSubscription,
      args: {
        input: { type: new GraphQLNonNull(GraphQLSubscriptionInput) },
      },
      resolve: (root, { input }, { authenticate, prisma, memberContext }) =>
        createSubscription(input, authenticate, memberContext, prisma),
    },

    renewSubscription: {
      type: GraphQLInvoice,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { id },
        { authenticate, prisma: { subscription, invoice }, memberContext }
      ) =>
        renewSubscription(
          id,
          authenticate,
          subscription,
          invoice,
          memberContext
        ),
    },

    updateSubscription: {
      type: GraphQLSubscription,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLSubscriptionInput) },
      },
      resolve: (
        root,
        { id, input },
        { authenticate, prisma, memberContext, paymentProviders, loaders }
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
        ),
    },

    deleteSubscription: {
      type: GraphQLSubscription,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { subscription } }) =>
        deleteSubscriptionById(id, authenticate, subscription),
    },

    cancelSubscription: {
      type: GraphQLSubscription,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        reason: {
          type: new GraphQLNonNull(GraphQLSubscriptionDeactivationReason),
        },
      },
      resolve: (
        root,
        { id, reason },
        { authenticate, prisma: { subscription }, memberContext }
      ) =>
        cancelSubscriptionById(
          id,
          reason,
          authenticate,
          subscription,
          memberContext
        ),
    },

    // Invoice
    // ======

    createInvoice: {
      type: GraphQLInvoice,
      args: { input: { type: new GraphQLNonNull(GraphQLInvoiceInput) } },
      resolve: (root, { input }, { authenticate, prisma: { invoice } }) =>
        createInvoice(input, authenticate, invoice),
    },

    createPaymentFromInvoice: {
      type: GraphQLPayment,
      args: {
        input: { type: new GraphQLNonNull(GraphQLPaymentFromInvoiceInput) },
      },
      resolve: (
        root,
        { input },
        {
          authenticate,
          loaders,
          paymentProviders,
          prisma: { payment, memberPlan, subscription },
        }
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
        ),
    },

    updateInvoice: {
      type: GraphQLInvoice,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLInvoiceInput) },
      },
      resolve: (root, { id, input }, { authenticate, prisma: { invoice } }) =>
        updateInvoice(id, input, authenticate, invoice),
    },

    deleteInvoice: {
      type: GraphQLInvoice,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { invoice } }) =>
        deleteInvoiceById(id, authenticate, invoice),
    },

    markInvoiceAsPaid: {
      type: GraphQLInvoice,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma, authenticateUser }) =>
        markInvoiceAsPaid(id, authenticate, authenticateUser, prisma),
    },

    // Comment
    // ======
    updateComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        revision: { type: GraphQLCommentRevisionUpdateInput },
        userID: { type: GraphQLString },
        guestUsername: { type: GraphQLString },
        guestUserImageID: { type: GraphQLString },
        featured: { type: GraphQLBoolean },
        source: { type: GraphQLString },
        tagIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        ratingOverrides: {
          type: new GraphQLList(
            new GraphQLNonNull(GraphQLCommentRatingOverrideUpdateInput)
          ),
        },
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
          tagIds,
        },
        { authenticate, prisma: { comment, commentRatingSystemAnswer } }
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
        ),
    },

    createComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        text: { type: GraphQLRichText },
        tagIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        itemID: { type: new GraphQLNonNull(GraphQLString) },
        parentID: { type: GraphQLString },
        itemType: {
          type: new GraphQLNonNull(GraphQLCommentItemType),
        },
      },
      resolve: (
        root,
        { text, tagIds, itemID, itemType, parentID },
        { authenticate, prisma: { comment } }
      ) =>
        createAdminComment(
          itemID,
          itemType,
          parentID,
          text,
          tagIds,
          authenticate,
          comment
        ),
    },

    approveComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { comment } }) =>
        takeActionOnComment(
          id,
          { state: CommentState.approved },
          authenticate,
          comment
        ),
    },

    rejectComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        rejectionReason: { type: GraphQLCommentRejectionReason },
      },
      resolve: (
        root,
        { id, rejectionReason },
        { authenticate, prisma: { comment } }
      ) =>
        takeActionOnComment(
          id,
          { state: CommentState.rejected, rejectionReason },
          authenticate,
          comment
        ),
    },

    requestChangesOnComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        rejectionReason: {
          type: new GraphQLNonNull(GraphQLCommentRejectionReason),
        },
      },
      resolve: (
        root,
        { id, rejectionReason },
        { authenticate, prisma: { comment } }
      ) =>
        takeActionOnComment(
          id,
          { state: CommentState.pendingUserChanges, rejectionReason },
          authenticate,
          comment
        ),
    },

    deleteComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { comment } }) =>
        deleteComment(id, authenticate, comment),
    },

    // Poll
    // ==========

    createPoll: {
      type: GraphQLPollWithAnswers,
      args: {
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
      },
      resolve: (root, input, { authenticate, prisma: { poll } }) =>
        createPoll(input, authenticate, poll),
    },

    createPollAnswer: {
      type: GraphQLPollAnswer,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        answer: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, answer },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollAnswer(
          pollId,
          answer,
          authenticate,
          pollExternalVoteSource,
          pollAnswer
        ),
    },

    createPollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        source: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, source },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollExternalVoteSource(
          pollId,
          source,
          authenticate,
          pollAnswer,
          pollExternalVoteSource
        ),
    },

    updatePoll: {
      type: GraphQLFullPoll,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
        infoText: { type: GraphQLRichText },
        answers: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollAnswer)),
        },
        externalVoteSources: {
          type: new GraphQLList(
            new GraphQLNonNull(GraphQLUpdatePollExternalVoteSources)
          ),
        },
      },
      resolve: (
        root,
        { pollId, answers, externalVoteSources, ...pollInput },
        { authenticate, prisma: { poll } }
      ) =>
        updatePoll(
          pollId,
          pollInput,
          answers,
          externalVoteSources,
          authenticate,
          poll
        ),
    },

    deletePoll: {
      type: GraphQLFullPoll,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { poll } }) =>
        deletePoll(id, authenticate, poll),
    },

    deletePollAnswer: {
      type: GraphQLPollAnswerWithVoteCount,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { pollAnswer } }) =>
        deletePollAnswer(id, authenticate, pollAnswer),
    },

    deletePollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { id },
        { authenticate, prisma: { pollExternalVoteSource } }
      ) =>
        deletePollExternalVoteSource(id, authenticate, pollExternalVoteSource),
    },
  },
});
