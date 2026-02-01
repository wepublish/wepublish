import { CommentState } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';

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
import {
  GraphQLImage,
  GraphQLUpdateImageInput,
  GraphQLUploadImageInput,
} from './image';
import {
  createImage,
  deleteImageById,
  updateImage,
} from './image/image.private-mutation';
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
import { GraphQLSubscription, GraphQLSubscriptionInput } from './subscription';
import {
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  importSubscription,
  renewSubscription,
  updateAdminSubscription,
} from './subscription/subscription.private-mutation';

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

    importSubscription: {
      type: GraphQLSubscription,
      args: {
        input: { type: new GraphQLNonNull(GraphQLSubscriptionInput) },
      },
      resolve: (root, { input }, { authenticate, prisma, memberContext }) =>
        importSubscription(input, authenticate, memberContext, prisma),
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

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: { input: { type: new GraphQLNonNull(GraphQLUploadImageInput) } },
      resolve: (
        root,
        { input },
        { authenticate, mediaAdapter, prisma: { image } }
      ) => createImage(input, authenticate, mediaAdapter, image),
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLUpdateImageInput) },
      },
      resolve: (root, { id, input }, { authenticate, prisma: { image } }) =>
        updateImage(id, input, authenticate, image),
    },

    deleteImage: {
      type: GraphQLImage,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (
        root,
        { id },
        { authenticate, mediaAdapter, prisma: { image } }
      ) => deleteImageById(id, authenticate, image, mediaAdapter),
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
