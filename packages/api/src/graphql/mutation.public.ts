import {SubscriptionDeactivationReason} from '@prisma/client'
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
import {SettingName} from '../db/setting'
import {unselectPassword} from '../db/user'
import {
  CommentAuthenticationError,
  EmailAlreadyInUseError,
  InternalError,
  MonthlyAmountNotEnough,
  NotAuthenticatedError,
  NotFound,
  UserInputError,
  UserSubscriptionAlreadyDeactivated
} from '../error'
import {SendMailType} from '../mails/mailContext'
import {logger} from '../server'
import {FIFTEEN_MINUTES_IN_MILLISECONDS, USER_PROPERTY_LAST_LOGIN_LINK_SEND} from '../utility'
import {Validator} from '../validator'
import {
  GraphQLChallengeInput,
  GraphQLPublicComment,
  GraphQLPublicCommentInput,
  GraphQLPublicCommentUpdateInput
} from './comment'
import {addPublicComment, updatePublicComment} from './comment/comment.public-mutation'
import {GraphQLMetadataPropertyPublicInput} from './common'
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
import {GraphQLPublicSubscription, GraphQLPublicSubscriptionInput} from './subscription'
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
  updateUserPassword
} from './user/user.public-mutation'

export const GraphQLPublicMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Session
    // =======

    createSession: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)},
        password: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {email, password}, {sessionTTL, prisma}) =>
        createSession(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {jwt}, {sessionTTL, prisma, verifyJWT}) =>
        createJWTSession(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
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

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      description: 'This mutation revokes and deletes the active session.',
      resolve: (root, _, {authenticateUser, prisma: {session}}) =>
        revokeSessionByToken(authenticateUser, session)
    },

    // Comment
    // =======
    addComment: {
      type: GraphQLNonNull(GraphQLPublicComment),
      args: {input: {type: GraphQLNonNull(GraphQLPublicCommentInput)}},
      description: 'This mutation allows to add a comment. The input is of type CommentInput.',
      resolve: (_, {input}, {optionalAuthenticateUser, prisma: {comment, setting}, challenge}) =>
        addPublicComment(input, optionalAuthenticateUser, challenge, setting, comment)
    },

    updateComment: {
      type: GraphQLNonNull(GraphQLPublicComment),
      args: {
        input: {type: GraphQLNonNull(GraphQLPublicCommentUpdateInput)}
      },
      description:
        'This mutation allows to update a comment. The input is of type CommentUpdateInput which contains the ID of the comment you want to update and the new text.',
      resolve: (_, {input}, {prisma: {comment}, authenticateUser}) =>
        updatePublicComment(input, authenticateUser, comment)
    },

    registerMember: {
      type: GraphQLNonNull(GraphQLMemberRegistration),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        firstName: {type: GraphQLString},
        preferredName: {type: GraphQLString},
        email: {type: GraphQLNonNull(GraphQLString)},
        address: {type: GraphQLUserAddressInput},
        password: {type: GraphQLString},
        challengeAnswer: {
          type: GraphQLNonNull(GraphQLChallengeInput)
        }
      },
      description: 'This mutation allows to register a new member,',
      async resolve(
        root,
        {name, firstName, preferredName, email, address, password, challengeAnswer},
        {sessionTTL, hashCostFactor, prisma, challenge}
      ) {
        email = email.toLowerCase()
        await Validator.createUser().validateAsync(
          {name, email, firstName, preferredName},
          {allowUnknown: true}
        )

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
            preferredName,
            email,
            address,
            emailVerifiedAt: null,
            active: true,
            roleIDs: [],
            password
          },
          hashCostFactor,
          prisma.user
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
      type: GraphQLNonNull(GraphQLMemberRegistrationAndPayment),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        firstName: {type: GraphQLString},
        preferredName: {type: GraphQLString},
        email: {type: GraphQLNonNull(GraphQLString)},
        address: {type: GraphQLUserAddressInput},
        password: {type: GraphQLString},
        memberPlanID: {type: GraphQLID},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLID},
        paymentMethodSlug: {type: GraphQLSlug},
        subscriptionProperties: {
          type: GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublicInput))
        },
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString},
        challengeAnswer: {
          type: GraphQLNonNull(GraphQLChallengeInput)
        }
      },
      description:
        'This mutation allows to register a new member, select a member plan, payment method and create an invoice. ',
      async resolve(
        root,
        {
          name,
          firstName,
          preferredName,
          email,
          address,
          password,
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
          createPaymentWithProvider
        }
      ) {
        email = email.toLowerCase()
        await Validator.createUser().validateAsync(
          {name, email, firstName, preferredName},
          {allowUnknown: true}
        )
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
            email: email
          },
          select: unselectPassword
        })

        if (userExists) throw new EmailAlreadyInUseError()

        if (!password) password = crypto.randomBytes(48).toString('base64')

        const user = await createUser(
          {
            name,
            firstName,
            preferredName,
            email,
            address,
            emailVerifiedAt: null,
            active: true,
            roleIDs: [],
            password
          },
          hashCostFactor,
          prisma.user
        )

        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }

        const session = await createUserSession(user, sessionTTL, prisma.session, prisma.userRole)
        const properties = await memberContext.processSubscriptionProperties(subscriptionProperties)

        const subscription = await memberContext.createSubscription(
          prisma.subscription,
          user.id,
          paymentMethod,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan,
          properties,
          autoRenew
        )

        // Create Periods, Invoices and Payment
        const invoice = await memberContext.renewSubscriptionForUser({
          subscription
        })

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
      type: GraphQLNonNull(GraphQLPublicPayment),
      args: {
        memberPlanID: {type: GraphQLID},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLID},
        paymentMethodSlug: {type: GraphQLSlug},
        subscriptionProperties: {
          type: GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublicInput))
        },
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString}
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
          failureURL
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

        const properties = await memberContext.processSubscriptionProperties(subscriptionProperties)

        const subscription = await memberContext.createSubscription(
          prisma.subscription,
          user.id,
          paymentMethod,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan,
          properties,
          autoRenew
        )

        // Create Periods, Invoices and Payment
        const invoice = await memberContext.renewSubscriptionForUser({
          subscription
        })

        if (!invoice) {
          logger('mutation.public').error(
            'Could not create new invoice for subscription with ID "%s"',
            subscription.id
          )
          throw new InternalError()
        }

        return await createPaymentWithProvider({
          invoice,
          saveCustomer: true,
          paymentMethodID: paymentMethod.id,
          successURL,
          failureURL
        })
      }
    },

    sendWebsiteLogin: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      description:
        'This mutation sends a login link to the email if the user exists. Method will always return email address',
      async resolve(root, {email}, {prisma, generateJWT, mailContext, urlAdapter}) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email}, {allowUnknown: true})

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

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: resetPwd
        })

        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: user.email,
          data: {
            url: urlAdapter.getLoginURL(token),
            user
          }
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
        input: {type: GraphQLNonNull(GraphQLPublicUserInput)}
      },
      description:
        "This mutation allows to update the user's data by taking an input of type UserInput.",
      resolve: (root, {input}, {authenticateUser, prisma: {user}}) =>
        updatePublicUser(input, authenticateUser, user)
    },

    updatePassword: {
      type: GraphQLPublicUser,
      args: {
        password: {type: GraphQLNonNull(GraphQLString)},
        passwordRepeated: {type: GraphQLNonNull(GraphQLString)}
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
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPublicSubscriptionInput)}
      },
      description:
        "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null",
      resolve: (
        root,
        {id, input},
        {authenticateUser, prisma: {subscription}, loaders, memberContext}
      ) =>
        updatePublicSubscription(
          id,
          input,
          authenticateUser,
          memberContext,
          loaders.activeMemberPlansByID,
          loaders.activePaymentMethodsByID,
          subscription
        )
    },

    cancelUserSubscription: {
      type: GraphQLPublicSubscription,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
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

        if (!subscription) throw new NotFound('subscription', id)

        if (subscription.deactivation)
          throw new UserSubscriptionAlreadyDeactivated(subscription.deactivation.date)

        const now = new Date()
        const deactivationDate =
          subscription.paidUntil !== null && subscription.paidUntil > now
            ? subscription.paidUntil
            : now

        await memberContext.deactivateSubscriptionForUser({
          subscriptionID: subscription.id,
          deactivationDate,
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProviderCustomer))),
      args: {
        input: {
          type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProviderCustomerInput)))
        }
      },
      description: 'This mutation allows to update the Payment Provider Customers',
      resolve: (root, {input}, {authenticateUser, prisma: {user}}) =>
        updatePaymentProviderCustomers(input, authenticateUser, user)
    },

    createPaymentFromInvoice: {
      type: GraphQLPublicPayment,
      args: {
        input: {type: GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}
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
          where: {id: invoiceID},
          include: {
            items: true
          }
        })

        if (!invoice || !invoice.subscriptionID) throw new NotFound('Invoice', invoiceID)

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

        return await createPaymentWithProvider({
          paymentMethodID: paymentMethod.id,
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
        answerId: {type: GraphQLNonNull(GraphQLID)}
      },
      description:
        "This mutation allows to vote on a poll (or update one's decision). Supports logged in and anonymous",
      resolve: (root, {answerId}, {optionalAuthenticateUser, prisma: {pollAnswer, pollVote}}) =>
        voteOnPoll(answerId, undefined, optionalAuthenticateUser, pollAnswer, pollVote)
    }
  }
})
