import {PaymentState, SubscriptionDeactivationReason, UserEvent, Subscription} from '@prisma/client'
import {SettingName} from '@wepublish/settings/api'
import {unselectPassword} from '@wepublish/user/api'
import * as crypto from 'crypto'
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {SubscriptionWithRelations} from '../db/subscription'
import {
  AlreadyUnpaidInvoices,
  CommentAuthenticationError,
  EmailAlreadyInUseError,
  InternalError,
  InvoiceAlreadyPaidOrCanceled,
  MonthlyAmountNotEnough,
  NotAuthenticatedError,
  NotFound,
  PaymentAlreadyRunning,
  SubscriptionNotExtendable,
  SubscriptionNotFound,
  SubscriptionToDeactivateDoesNotExist,
  UserInputError,
  UserSubscriptionAlreadyDeactivated
} from '../error'
import {logger} from '@wepublish/utils/api'
import {FIFTEEN_MINUTES_IN_MILLISECONDS, USER_PROPERTY_LAST_LOGIN_LINK_SEND} from '../utility'
import {Validator} from '../validator'
import {rateComment} from './comment-rating/comment-rating.public-mutation'
import {
  GraphQLChallengeInput,
  GraphQLPublicComment,
  GraphQLPublicCommentInput,
  GraphQLPublicCommentUpdateInput
} from './comment/comment'
import {addPublicComment, updatePublicComment} from './comment/comment.public-mutation'
import {GraphQLMetadataPropertyPublicInput} from './common'
import {GraphQLUploadImageInput} from './image'
import {GraphQLPaymentPeriodicity} from './memberPlan'
import {GraphQLPaymentFromInvoiceInput, GraphQLPublicPayment} from './payment'
import {GraphQLPollVote} from './poll/poll'
import {voteOnPoll} from './poll/poll.public-mutation'
import {GraphQLPublicSessionWithToken} from './session'
import {
  createJWTSession,
  createOAuth2Session,
  createSession,
  createUserSession,
  revokeSessionByToken
} from './session/session.mutation'
import {GraphQLSlug} from './slug'
import {GraphQLPublicSubscription, GraphQLPublicSubscriptionInput} from './subscription-public'
import {updatePublicSubscription} from './subscription/subscription.public-mutation'
import {
  GraphQLMemberRegistration,
  GraphQLMemberRegistrationAndPayment,
  GraphQLPaymentProviderCustomer,
  GraphQLPaymentProviderCustomerInput,
  GraphQLPublicUser,
  GraphQLPublicUserInput,
  GraphQLUserAddressInput
} from './user'
import {createUser} from './user/user.mutation'
import {
  updatePaymentProviderCustomers,
  updatePublicUser,
  updateUserPassword,
  uploadPublicUserProfileImage
} from './user/user.public-mutation'

import {mailLogType} from '@wepublish/mail/api'
import {sub} from 'date-fns'
import {GraphQLDateTime} from 'graphql-scalars'

export const GraphQLPublicMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Session
    // =======

    createSession: {
      type: new GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        email: {type: new GraphQLNonNull(GraphQLString)},
        password: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {email, password}, {sessionTTL, prisma}) =>
        createSession(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithJWT: {
      type: new GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        jwt: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {jwt}, {sessionTTL, prisma, verifyJWT}) =>
        createJWTSession(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithOAuth2Code: {
      type: new GraphQLNonNull(GraphQLPublicSessionWithToken),
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

    revokeActiveSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {},
      description: 'This mutation revokes and deletes the active session.',
      resolve: (root, _, {authenticateUser, prisma: {session}}) =>
        revokeSessionByToken(authenticateUser, session)
    },

    // Comment
    // =======
    addComment: {
      type: new GraphQLNonNull(GraphQLPublicComment),
      args: {input: {type: new GraphQLNonNull(GraphQLPublicCommentInput)}},
      description: 'This mutation allows to add a comment. The input is of type CommentInput.',
      resolve: (_, {input}, {optionalAuthenticateUser, prisma: {comment, setting}, challenge}) =>
        addPublicComment(input, optionalAuthenticateUser, challenge, setting, comment)
    },

    updateComment: {
      type: new GraphQLNonNull(GraphQLPublicComment),
      args: {
        input: {type: new GraphQLNonNull(GraphQLPublicCommentUpdateInput)}
      },
      description:
        'This mutation allows to update a comment. The input is of type CommentUpdateInput which contains the ID of the comment you want to update and the new text.',
      resolve: (_, {input}, {prisma: {comment, setting}, authenticateUser}) =>
        updatePublicComment(input, authenticateUser, comment, setting)
    },

    rateComment: {
      type: new GraphQLNonNull(GraphQLPublicComment),
      args: {
        commentId: {type: new GraphQLNonNull(GraphQLID)},
        answerId: {type: new GraphQLNonNull(GraphQLID)},
        value: {type: new GraphQLNonNull(GraphQLInt)}
      },
      description: 'This mutation allows to rate a comment. Supports logged in and anonymous',
      resolve: (
        root,
        {commentId, answerId, value},
        {
          optionalAuthenticateUser,
          prisma: {comment, commentRating, commentRatingSystemAnswer, setting}
        }
      ) =>
        rateComment(
          commentId,
          answerId,
          value,
          undefined,
          optionalAuthenticateUser,
          commentRatingSystemAnswer,
          commentRating,
          comment,
          setting
        )
    },

    registerMember: {
      type: new GraphQLNonNull(GraphQLMemberRegistration),
      args: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        firstName: {type: GraphQLString},
        email: {type: new GraphQLNonNull(GraphQLString)},
        address: {type: GraphQLUserAddressInput},
        password: {type: GraphQLString},
        birthday: {
          type: GraphQLDateTime
        },
        challengeAnswer: {
          type: new GraphQLNonNull(GraphQLChallengeInput)
        }
      },
      description: 'This mutation allows to register a new member,',
      async resolve(
        root,
        {name, firstName, email, address, birthday, password, challengeAnswer},
        {sessionTTL, hashCostFactor, prisma, challenge, mailContext}
      ) {
        email = email.toLowerCase()
        await Validator.createUser.parse({name, email, firstName})

        const challengeValidationResult = await challenge.validateChallenge({
          challengeID: challengeAnswer.challengeID,
          solution: challengeAnswer.challengeSolution
        })

        if (!challengeValidationResult.valid) {
          throw new CommentAuthenticationError(challengeValidationResult.message)
        }

        const userExists = await prisma.user.findUnique({
          where: {
            email
          },
          select: unselectPassword
        })

        if (userExists) {
          throw new EmailAlreadyInUseError()
        }

        if (!password) {
          password = crypto.randomBytes(48).toString('base64')
        }

        const user = await createUser(
          {
            name,
            firstName,
            email,
            birthday,
            address,
            emailVerifiedAt: null,
            active: true,
            roleIDs: [],
            password
          },
          hashCostFactor,
          prisma,
          mailContext
        )

        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }

        const session = await createUserSession(user, sessionTTL, prisma.session, prisma.userRole)

        return {
          user,
          session
        }
      }
    },

    registerMemberAndReceivePayment: {
      type: new GraphQLNonNull(GraphQLMemberRegistrationAndPayment),
      args: {
        name: {type: new GraphQLNonNull(GraphQLString)},
        birthday: {
          type: GraphQLDateTime
        },
        firstName: {type: GraphQLString},
        email: {type: new GraphQLNonNull(GraphQLString)},
        address: {type: GraphQLUserAddressInput},
        password: {type: GraphQLString},
        memberPlanID: {type: GraphQLID},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLID},
        paymentMethodSlug: {type: GraphQLSlug},
        subscriptionProperties: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublicInput))
        },
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString},
        challengeAnswer: {
          type: new GraphQLNonNull(GraphQLChallengeInput)
        }
      },
      description:
        'This mutation allows to register a new member, select a member plan, payment method and create an invoice. ',
      async resolve(
        root,
        {
          name,
          firstName,
          email,
          address,
          password,
          birthday,
          memberPlanID,
          memberPlanSlug,
          autoRenew,
          paymentPeriodicity,
          monthlyAmount,
          paymentMethodID,
          paymentMethodSlug,
          subscriptionProperties,
          successURL,
          failureURL,
          challengeAnswer
        },
        {
          sessionTTL,
          hashCostFactor,
          prisma,
          loaders,
          memberContext,
          challenge,
          createPaymentWithProvider,
          mailContext
        }
      ) {
        email = email.toLowerCase()
        await Validator.createUser.parse({name, email, firstName})
        const challengeValidationResult = await challenge.validateChallenge({
          challengeID: challengeAnswer.challengeID,
          solution: challengeAnswer.challengeSolution
        })
        if (!challengeValidationResult.valid)
          throw new CommentAuthenticationError(challengeValidationResult.message)

        await memberContext.validateInputParamsCreateSubscription(
          memberPlanID,
          memberPlanSlug,
          paymentMethodID,
          paymentMethodSlug
        )

        const memberPlan = await memberContext.getMemberPlanByIDOrSlug(
          loaders,
          memberPlanSlug,
          memberPlanID
        )

        const paymentMethod = await memberContext.getPaymentMethodByIDOrSlug(
          loaders,
          paymentMethodSlug,
          paymentMethodID
        )

        // Check that monthly amount not
        if (monthlyAmount < memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

        await memberContext.validateSubscriptionPaymentConfiguration(
          memberPlan,
          autoRenew,
          paymentPeriodicity,
          paymentMethod
        )

        const userExists = await prisma.user.findUnique({
          where: {
            email
          },
          select: unselectPassword
        })

        if (userExists) throw new EmailAlreadyInUseError()

        if (!password) password = crypto.randomBytes(48).toString('base64')

        const user = await createUser(
          {
            name,
            firstName,
            email,
            address,
            birthday,
            emailVerifiedAt: null,
            active: true,
            roleIDs: [],
            password
          },
          hashCostFactor,
          prisma,
          mailContext
        )

        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }

        const session = await createUserSession(user, sessionTTL, prisma.session, prisma.userRole)
        const properties = await memberContext.processSubscriptionProperties(subscriptionProperties)

        const {subscription, invoice} = await memberContext.createSubscription(
          prisma,
          user.id,
          paymentMethod.id,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan.id,
          properties,
          autoRenew,
          memberPlan.extendable
        )

        if (!invoice) {
          logger('mutation.public').error(
            'Could not create new invoice for subscription with ID "%s"',
            subscription.id
          )
          throw new InternalError()
        }

        return {
          payment: await createPaymentWithProvider({
            invoice,
            saveCustomer: true,
            paymentMethodID: paymentMethod.id,
            successURL,
            failureURL
          }),
          user,
          session
        }
      }
    },

    createSubscription: {
      type: new GraphQLNonNull(GraphQLPublicPayment),
      args: {
        memberPlanID: {type: GraphQLID},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: new GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: new GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLID},
        paymentMethodSlug: {type: GraphQLSlug},
        subscriptionProperties: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublicInput))
        },
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString},
        deactivateSubscriptionId: {type: GraphQLID}
      },
      description: 'Allows authenticated users to create additional subscriptions',
      async resolve(
        root,
        {
          memberPlanID,
          memberPlanSlug,
          autoRenew,
          paymentPeriodicity,
          monthlyAmount,
          paymentMethodID,
          paymentMethodSlug,
          subscriptionProperties,
          successURL,
          failureURL,
          deactivateSubscriptionId
        },
        {prisma, loaders, memberContext, createPaymentWithProvider, authenticateUser}
      ) {
        // authenticate user
        const {user} = authenticateUser()

        await memberContext.validateInputParamsCreateSubscription(
          memberPlanID,
          memberPlanSlug,
          paymentMethodID,
          paymentMethodSlug
        )

        const memberPlan = await memberContext.getMemberPlanByIDOrSlug(
          loaders,
          memberPlanSlug,
          memberPlanID
        )
        const paymentMethod = await memberContext.getPaymentMethodByIDOrSlug(
          loaders,
          paymentMethodSlug,
          paymentMethodID
        )

        if (monthlyAmount < memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

        await memberContext.validateSubscriptionPaymentConfiguration(
          memberPlan,
          autoRenew,
          paymentPeriodicity,
          paymentMethod
        )

        // Check if subscription which should be deactivated exists
        let subscriptionToDeactivate: null | Subscription = null
        if (deactivateSubscriptionId) {
          subscriptionToDeactivate = await prisma.subscription.findUnique({
            where: {
              id: deactivateSubscriptionId,
              userID: user.id,
              deactivation: {
                is: null
              }
            },
            include: {
              deactivation: true,
              periods: true,
              properties: true
            }
          })
          if (!subscriptionToDeactivate)
            throw new SubscriptionToDeactivateDoesNotExist(deactivateSubscriptionId)
        }

        const properties = await memberContext.processSubscriptionProperties(subscriptionProperties)

        const {subscription, invoice} = await memberContext.createSubscription(
          prisma,
          user.id,
          paymentMethod.id,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan.id,
          properties,
          autoRenew,
          memberPlan.extendable
        )

        if (!invoice) {
          logger('mutation.public').error(
            'Could not create new invoice for subscription with ID "%s"',
            subscription.id
          )
          throw new InternalError()
        }

        if (subscriptionToDeactivate) {
          await memberContext.deactivateSubscription({
            subscription: subscriptionToDeactivate,
            deactivationReason: SubscriptionDeactivationReason.userSelfDeactivated
          })
        }

        return await createPaymentWithProvider({
          invoice,
          saveCustomer: true,
          paymentMethodID: paymentMethod.id,
          successURL,
          failureURL,
          user
        })
      }
    },

    extendSubscription: {
      type: new GraphQLNonNull(GraphQLPublicPayment),
      args: {
        subscriptionId: {type: new GraphQLNonNull(GraphQLID)},
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString}
      },
      description: 'This mutation extends an subscription early',
      async resolve(
        root,
        {subscriptionId, successURL, failureURL},
        {
          prisma,
          authenticateUser,
          memberContext,
          createPaymentWithProvider,
          paymentProviders,
          loaders
        }
      ) {
        // authenticate user
        const {user} = authenticateUser()

        const subscription = (await prisma.subscription.findUnique({
          where: {
            id: subscriptionId
          }
        })) as SubscriptionWithRelations
        // Allow only valid and subscription belonging to the user to early extend
        if (!subscription || subscription.userID !== user.id) {
          logger('extendSubscription').error(
            'Could not find subscription with ID "%s" or subscription does not belong to user "%s"',
            subscriptionId,
            user.id
          )
          throw new SubscriptionNotFound()
        }

        // Prevent user from extending not extendable subscription
        if (!subscription.extendable) {
          throw new SubscriptionNotExtendable(subscription.id)
        }

        // Throw for unsupported payment providers
        const paymentMethod = await prisma.paymentMethod.findUnique({
          where: {
            id: subscription.paymentMethodID
          }
        })
        if (!paymentMethod) {
          logger('extendSubscription').error(
            'Could not find paymentMethod with ID "%s"',
            subscription.paymentMethodID
          )
          throw new InternalError()
        }

        const paymentProvider = paymentProviders.find(
          obj => obj.id === paymentMethod.paymentProviderID
        )

        // Prevent user from creating new invoice while having unpaid invoices
        const unpaidInvoices = await prisma.invoice.findMany({
          where: {
            subscriptionID: subscription.id,
            paidAt: null
          }
        })
        if (unpaidInvoices.length > 0) {
          throw new AlreadyUnpaidInvoices()
        }

        const invoice = await memberContext.renewSubscriptionForUser({
          subscription
        })
        if (!invoice) {
          logger('extendSubscription').error(
            'Could not create new invoice for subscription with ID "%s"',
            subscription.id
          )
          throw new InternalError()
        }

        // If payment provider supports off session payment try to charge
        if (!paymentProvider || paymentProvider.offSessionPayments) {
          const paymentMethod = await loaders.paymentMethodsByID.load(subscription.paymentMethodID)
          if (!paymentMethod) {
            logger('extendSubscription').warn(
              'paymentMethod %s not found',
              subscription.paymentMethodID
            )
            throw new InternalError()
          }

          const fullUser = await prisma.user.findUnique({
            where: {id: subscription.userID},
            select: unselectPassword
          })
          if (!fullUser) {
            logger('extendSubscription').warn('user %s not found', subscription.userID)
            throw new InternalError()
          }

          const customer = fullUser.paymentProviderCustomers.find(
            ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID
          )
          if (!customer) {
            logger('extendSubscription').warn(
              'customer %s not found',
              paymentMethod.paymentProviderID
            )
          } else {
            // Charge customer
            try {
              const payment = await memberContext.chargeInvoice({
                user,
                invoice,
                paymentMethodID: subscription.paymentMethodID,
                customer
              })
              if (payment) {
                return payment
              }
            } catch (e) {
              logger('extendSubscription').warn(
                'Invoice off session charge for subscription %s failed: %s',
                subscription.id,
                e
              )
            }
          }
        }

        return await createPaymentWithProvider({
          invoice,
          saveCustomer: true,
          paymentMethodID: subscription.paymentMethodID,
          successURL,
          failureURL
        })
      }
    },

    sendWebsiteLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        email: {type: new GraphQLNonNull(GraphQLString)}
      },
      description:
        'This mutation sends a login link to the email if the user exists. Method will always return email address',
      async resolve(root, {email}, {prisma, generateJWT, mailContext, urlAdapter}) {
        email = email.toLowerCase()
        await Validator.login.parse({email})

        const user = await prisma.user.findUnique({
          where: {email},
          select: unselectPassword
        })

        if (!user) return email

        const lastSendTimeStamp = user.properties.find(
          property => property?.key === USER_PROPERTY_LAST_LOGIN_LINK_SEND
        )

        if (
          lastSendTimeStamp &&
          parseInt(lastSendTimeStamp.value) > Date.now() - FIFTEEN_MINUTES_IN_MILLISECONDS
        ) {
          logger('mutation.public').warn(
            'User with ID %s requested Login Link multiple times in 15 min time window',
            user.id
          )
          return email
        }

        const resetPwdSetting = await prisma.setting.findUnique({
          where: {name: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN}
        })
        const resetPwd =
          (resetPwdSetting?.value as number) ??
          parseInt(process.env.RESET_PASSWORD_JWT_EXPIRES_MIN ?? '')

        if (!resetPwd) {
          throw new Error('No value set for RESET_PASSWORD_JWT_EXPIRES_MIN')
        }

        const remoteTemplate = await mailContext.getUserTemplateName(UserEvent.LOGIN_LINK)
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow
        })

        try {
          await prisma.user.update({
            where: {id: user.id},
            data: {
              properties: {
                deleteMany: {
                  key: USER_PROPERTY_LAST_LOGIN_LINK_SEND
                },
                create: {
                  key: USER_PROPERTY_LAST_LOGIN_LINK_SEND,
                  public: false,
                  value: `${Date.now()}`
                }
              }
            }
          })
        } catch (error) {
          logger('mutation.public').warn(error as Error, 'Updating User with ID %s failed', user.id)
        }

        return email
      }
    },

    updateUser: {
      type: GraphQLPublicUser,
      args: {
        input: {type: new GraphQLNonNull(GraphQLPublicUserInput)}
      },
      description:
        "This mutation allows to update the user's data by taking an input of type UserInput.",
      resolve: (root, {input}, {authenticateUser, mediaAdapter, prisma: {user, image}}) =>
        updatePublicUser(input, authenticateUser, mediaAdapter, user, image)
    },

    uploadUserProfileImage: {
      type: GraphQLPublicUser,
      args: {
        uploadImageInput: {type: GraphQLUploadImageInput}
      },
      description: "This mutation allows to upload and update the user's profile image.",
      resolve: (
        root,
        {uploadImageInput},
        {authenticateUser, mediaAdapter, prisma: {image, user}}
      ) =>
        uploadPublicUserProfileImage(uploadImageInput, authenticateUser, mediaAdapter, image, user)
    },

    updatePassword: {
      type: GraphQLPublicUser,
      args: {
        password: {type: new GraphQLNonNull(GraphQLString)},
        passwordRepeated: {type: new GraphQLNonNull(GraphQLString)}
      },
      description:
        "This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.",
      resolve: (
        root,
        {password, passwordRepeated},
        {authenticateUser, prisma: {user}, hashCostFactor}
      ) => updateUserPassword(password, passwordRepeated, hashCostFactor, authenticateUser, user)
    },

    updateUserSubscription: {
      type: GraphQLPublicSubscription,
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)},
        input: {type: new GraphQLNonNull(GraphQLPublicSubscriptionInput)}
      },
      description:
        "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null",
      resolve: (
        root,
        {id, input},
        {authenticateUser, prisma: {subscription}, loaders, memberContext, paymentProviders}
      ) =>
        updatePublicSubscription(
          id,
          input,
          authenticateUser,
          memberContext,
          loaders.activeMemberPlansByID,
          loaders.activePaymentMethodsByID,
          subscription,
          paymentProviders
        )
    },

    cancelUserSubscription: {
      type: GraphQLPublicSubscription,
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      description:
        'This mutation allows to cancel the users subscriptions. The deactivation date will be either paidUntil or now',
      async resolve(root, {id}, {authenticateUser, prisma, memberContext}) {
        const {user} = authenticateUser()
        if (!user) throw new NotAuthenticatedError()

        const subscription = await prisma.subscription.findUnique({
          where: {id},
          include: {
            deactivation: true,
            periods: true,
            properties: true
          }
        })

        if (!subscription || subscription.userID !== user.id) throw new NotFound('subscription', id)

        if (subscription.deactivation)
          throw new UserSubscriptionAlreadyDeactivated(subscription.deactivation.date)

        await memberContext.deactivateSubscription({
          subscription,
          deactivationReason: SubscriptionDeactivationReason.userSelfDeactivated
        })

        const updatedSubscription = await prisma.subscription.findUnique({
          where: {id},
          include: {
            deactivation: true,
            periods: true,
            properties: true
          }
        })

        if (!updatedSubscription) throw new NotFound('subscription', id)

        return updatedSubscription
      }
    },

    updatePaymentProviderCustomers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomer))),
      args: {
        input: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomerInput))
          )
        }
      },
      description: 'This mutation allows to update the Payment Provider Customers',
      resolve: (root, {input}, {authenticateUser, prisma: {user}}) =>
        updatePaymentProviderCustomers(input, authenticateUser, user)
    },

    createPaymentFromInvoice: {
      type: GraphQLPublicPayment,
      args: {
        input: {type: new GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}
      },
      description:
        'This mutation allows to create payment by taking an input of type PaymentFromInvoiceInput.',
      async resolve(root, {input}, {authenticateUser, createPaymentWithProvider, loaders, prisma}) {
        const {user} = authenticateUser()
        const {invoiceID, paymentMethodID, paymentMethodSlug, successURL, failureURL} = input

        if (
          (paymentMethodID == null && paymentMethodSlug == null) ||
          (paymentMethodID != null && paymentMethodSlug != null)
        ) {
          throw new UserInputError(
            'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
          )
        }

        const paymentMethod = paymentMethodID
          ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
          : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug)
        if (!paymentMethod)
          throw new NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug)

        const invoice = await prisma.invoice.findUnique({
          where: {
            id: invoiceID
          },
          include: {
            items: true
          }
        })

        if (!invoice || !invoice.subscriptionID) throw new NotFound('Invoice', invoiceID)

        if (invoice.paidAt || invoice.canceledAt) throw new InvoiceAlreadyPaidOrCanceled(invoiceID)

        const subscription = await prisma.subscription.findUnique({
          where: {
            id: invoice.subscriptionID
          },
          include: {
            deactivation: true,
            periods: true,
            properties: true
          }
        })

        if (!subscription || subscription.userID !== user.id)
          throw new NotFound('Invoice', invoiceID)

        // Prevent multiple payment of same invoice!
        const blockingPaymnet = await prisma.payment.findFirst({
          where: {
            invoiceID,
            state: {
              in: [PaymentState.created, PaymentState.submitted, PaymentState.processing]
            },
            createdAt: {
              gte: sub(new Date(), {minutes: 1})
            }
          }
        })
        if (blockingPaymnet) throw new PaymentAlreadyRunning(blockingPaymnet.id)

        // update subscription's payment provider in case user changed it along with the payment
        if (paymentMethod.id !== subscription.paymentMethodID) {
          const updatedSubscription = await prisma.subscription.update({
            data: {
              paymentMethodID: paymentMethod.id
            },
            where: {
              id: subscription.id
            }
          })

          if (!updatedSubscription) {
            throw new Error('Could not update payment provider for this subscription!')
          }
        }

        return await createPaymentWithProvider({
          paymentMethodID: paymentMethod.id,
          invoice,
          saveCustomer: false,
          successURL,
          failureURL,
          user
        })
      }
    },

    createPaymentFromSubscription: {
      type: GraphQLPublicPayment,
      args: {
        subscriptionId: {type: GraphQLID},
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString}
      },
      description: 'This mutation allows to create payment by referencing a subscription.',
      async resolve(
        root,
        {subscriptionId, successURL, failureURL},
        {authenticateUser, createPaymentWithProvider, prisma}
      ) {
        const {user} = authenticateUser()

        const invoice = await prisma.invoice.findFirst({
          where: {
            subscriptionID: subscriptionId,
            paidAt: null,
            canceledAt: null
          },
          include: {
            items: true,
            subscription: true
          }
        })

        if (!invoice) {
          throw new NotFound('Unpaid Invoice', subscriptionId)
        }

        if (invoice.subscription.userID !== user.id) {
          throw new NotFound('Subscription', subscriptionId)
        }

        return await createPaymentWithProvider({
          paymentMethodID: invoice.subscription.paymentMethodID,
          invoice,
          saveCustomer: false,
          successURL,
          failureURL
        })
      }
    },

    voteOnPoll: {
      type: GraphQLPollVote,
      args: {
        answerId: {type: new GraphQLNonNull(GraphQLID)}
      },
      description:
        "This mutation allows to vote on a poll (or update one's decision). Supports logged in and anonymous",
      resolve: (
        root,
        {answerId},
        {optionalAuthenticateUser, prisma: {pollAnswer, pollVote, setting}, fingerprint}
      ) =>
        voteOnPoll(answerId, fingerprint, optionalAuthenticateUser, pollAnswer, pollVote, setting)
    }
  }
})
