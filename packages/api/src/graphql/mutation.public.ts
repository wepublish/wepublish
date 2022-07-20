import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'

import {Issuer} from 'openid-client'

import {GraphQLPublicSessionWithToken} from './session'
import {Context} from '../context'

import {
  AnonymousCommentError,
  AnonymousCommentsDisabledError,
  ChallengeMissingCommentError,
  CommentAuthenticationError,
  CommentLengthError,
  EmailAlreadyInUseError,
  InternalError,
  InvalidCredentialsError,
  InvalidOAuth2TokenError,
  MonthlyAmountNotEnough,
  NotActiveError,
  NotAuthenticatedError,
  NotAuthorisedError as NotAuthorizedError,
  NotFound,
  OAuth2ProviderNotFoundError,
  PaymentConfigurationNotAllowed,
  UserInputError,
  UserNotFoundError,
  UserSubscriptionAlreadyDeactivated
} from '../error'
import {GraphQLPaymentFromInvoiceInput, GraphQLPublicPayment} from './payment'
import {GraphQLPaymentPeriodicity} from './memberPlan'
import {
  GraphQLMemberRegistration,
  GraphQLMemberRegistrationAndPayment,
  GraphQLPaymentProviderCustomer,
  GraphQLPaymentProviderCustomerInput,
  GraphQLPublicUser,
  GraphQLPublicUserInput,
  GraphQLUserAddressInput
} from './user'
import {
  GraphQLChallengeInput,
  GraphQLPublicComment,
  GraphQLPublicCommentInput,
  GraphQLPublicCommentUpdateInput
} from './comment'
import {CommentAuthorType, CommentState} from '../db/comment'
import {
  countRichtextChars,
  FIFTEEN_MINUTES_IN_MILLISECONDS,
  MAX_COMMENT_LENGTH,
  USER_PROPERTY_LAST_LOGIN_LINK_SEND
} from '../utility'
import {SendMailType} from '../mails/mailContext'
import {GraphQLSlug} from './slug'
import {logger} from '../server'
import {GraphQLPublicSubscription, GraphQLPublicSubscriptionInput} from './subscription'
import {SubscriptionDeactivationReason} from '../db/subscription'
import {GraphQLMetadataPropertyPublicInput} from './common'
import {SettingName} from '../db/setting'
import * as crypto from 'crypto'
import {Validator} from '../validator'

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
      description:
        "This mutation allows to create a user session by taking the user's credentials email and password as an input and returns a session with token.",
      async resolve(root, {email, password}, {dbAdapter}) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email}, {allowUnknown: true})
        const user = await dbAdapter.user.getUserForCredentials({email, password})
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      description:
        'This mutation allows to create a user session with JSON Web Token by taking the JSON Web Token as an input and returns a session with token',
      async resolve(root, {jwt}, {dbAdapter, verifyJWT}) {
        const userID = verifyJWT(jwt)

        const user = await dbAdapter.user.getUserByID(userID)
        if (!user) throw new InvalidCredentialsError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithOAuth2Code: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        code: {type: GraphQLNonNull(GraphQLString)},
        redirectUri: {type: GraphQLNonNull(GraphQLString)}
      },
      description:
        'This mutation allows to create user session with OAuth2 code by taking the name, code and redirect Uri as an input and returns a session with token.',
      async resolve(root, {name, code, redirectUri}, {dbAdapter, oauth2Providers}) {
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
        const user = await dbAdapter.user.getUser(userInfo.email)
        if (!user) throw new UserNotFoundError()
        if (!user.active) throw new NotActiveError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      description: 'This mutation revokes and deletes the active session.',
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const session = authenticateUser()
        return session ? await dbAdapter.session.deleteUserSessionByToken(session.token) : false
      }
    },

    // Comment
    // =======
    addComment: {
      type: GraphQLNonNull(GraphQLPublicComment),
      args: {input: {type: GraphQLNonNull(GraphQLPublicCommentInput)}},
      description: 'This mutation allows to add a comment. The input is of type CommentInput.',
      async resolve(_, {input}, {optionalAuthenticateUser, dbAdapter, challenge, loaders}) {
        const user = optionalAuthenticateUser()
        let authorType = CommentAuthorType.VerifiedUser
        const commentLength = countRichtextChars(0, input.text)

        if (commentLength > MAX_COMMENT_LENGTH) {
          throw new CommentLengthError()
        }

        // Challenge
        if (!user) {
          authorType = CommentAuthorType.GuestUser
          const guestCanComment =
            (await dbAdapter.setting.getSetting(SettingName.ALLOW_GUEST_COMMENTING))?.value ??
            process.env.ENABLE_ANONYMOUS_COMMENTS === 'true'
          if (!guestCanComment) throw new AnonymousCommentsDisabledError()

          if (!input.guestUsername) throw new AnonymousCommentError()
          if (!input.challenge) throw new ChallengeMissingCommentError()

          const challengeValidationResult = await challenge.validateChallenge({
            challengeID: input.challenge.challengeID,
            solution: input.challenge.challengeSolution
          })
          if (!challengeValidationResult.valid)
            throw new CommentAuthenticationError(challengeValidationResult.message)
        } else {
          input.guestUsername = ''
        }

        // Cleanup
        delete input.challenge
        delete input.challengeSolution

        return await dbAdapter.comment.addPublicComment({
          input: {
            ...input,
            userID: user?.user.id,
            authorType,
            state: CommentState.PendingApproval
          }
        })
      }
    },

    updateComment: {
      type: GraphQLNonNull(GraphQLPublicComment),
      args: {
        input: {type: GraphQLNonNull(GraphQLPublicCommentUpdateInput)}
      },
      description:
        'This mutation allows to update a comment. The input is of type CommentUpdateInput which contains the ID of the comment you want to update and the new text.',
      async resolve(_, {input}, {dbAdapter, authenticateUser}) {
        const {user} = authenticateUser()

        const comment = await dbAdapter.comment.getCommentById(input.id)

        if (!comment) return null

        if (user.id !== comment?.userID) {
          throw new NotAuthorizedError()
        } else if (comment.state !== CommentState.PendingUserChanges) {
          throw new UserInputError('Comment state must be pending user changes')
        } else {
          const {id, text} = input

          return await dbAdapter.comment.updatePublicComment({
            id,
            text,
            state: CommentState.PendingApproval
          })
        }
      }
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
        {dbAdapter, loaders, memberContext, createPaymentWithProvider, challenge}
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

        const userExists = await dbAdapter.user.getUser(email)
        if (userExists) throw new EmailAlreadyInUseError()

        if (!password) password = crypto.randomBytes(48).toString('base64')

        const user = await dbAdapter.user.createUser({
          input: {
            name,
            firstName,
            preferredName,
            email,
            address,
            emailVerifiedAt: null,
            active: true,
            properties: [],
            roleIDs: [],
            paymentProviderCustomers: []
          },
          password
        })
        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }
        const session = await dbAdapter.session.createUserSession(user)

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
        {dbAdapter, loaders, memberContext, createPaymentWithProvider, challenge}
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

        const userExists = await dbAdapter.user.getUser(email)
        if (userExists) throw new EmailAlreadyInUseError()

        if (!password) password = crypto.randomBytes(48).toString('base64')

        const user = await dbAdapter.user.createUser({
          input: {
            name,
            firstName,
            preferredName,
            email,
            address,
            emailVerifiedAt: null,
            active: true,
            properties: [],
            roleIDs: [],
            paymentProviderCustomers: []
          },
          password
        })
        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }
        const session = await dbAdapter.session.createUserSession(user)

        const properties = await memberContext.processSubscriptionProperties(subscriptionProperties)

        const subscription = await memberContext.createSubscription(
          dbAdapter,
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
        {dbAdapter, loaders, memberContext, createPaymentWithProvider, authenticateUser}
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
          dbAdapter,
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
      async resolve(root, {email}, {dbAdapter, generateJWT, mailContext, urlAdapter}) {
        email = email.toLowerCase()
        await Validator.login().validateAsync({email}, {allowUnknown: true})
        const user = await dbAdapter.user.getUser(email)
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
        const resetPwd =
          ((await dbAdapter.setting.getSetting(SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN))
            ?.value as number) ?? parseInt(process.env.RESET_PASSWORD_JWT_EXPIRES_MIN as string)
        if (!resetPwd) throw new Error('No value set for RESET_PASSWORD_JWT_EXPIRES_MIN')

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

        const properties = user.properties.filter(
          property => property?.key !== USER_PROPERTY_LAST_LOGIN_LINK_SEND
        )
        properties.push({
          key: USER_PROPERTY_LAST_LOGIN_LINK_SEND,
          public: false,
          value: `${Date.now()}`
        })

        try {
          await dbAdapter.user.updateUser({
            id: user.id,
            input: {
              ...user,
              properties
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
      async resolve(root, {input}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()

        input.email = input.email.toLowerCase()
        await Validator.createUser().validateAsync(input, {allowUnknown: true})

        const {name, email, firstName, preferredName, address} = input
        // TODO: implement new email check

        if (user.email !== email) {
          const userExists = await dbAdapter.user.getUser(email)
          if (userExists) throw new EmailAlreadyInUseError()
        }

        const updateUser = await dbAdapter.user.updateUser({
          id: user.id,
          input: {
            ...user,
            name,
            firstName,
            preferredName,
            address
          }
        })

        if (!updateUser) throw new Error('Error during updateUser')

        return updateUser
      }
    },

    updatePassword: {
      type: GraphQLPublicUser,
      args: {
        password: {type: GraphQLNonNull(GraphQLString)},
        passwordRepeated: {type: GraphQLNonNull(GraphQLString)}
      },
      description:
        "This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated.",
      async resolve(root, {password, passwordRepeated}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        if (!user) throw new NotAuthenticatedError()

        if (password !== passwordRepeated)
          throw new UserInputError('password and passwordRepeat are not equal')

        return await dbAdapter.user.resetUserPassword({
          id: user.id,
          password
        })
      }
    },

    updateUserSubscription: {
      type: GraphQLPublicSubscription,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)},
        input: {type: GraphQLNonNull(GraphQLPublicSubscriptionInput)}
      },
      description:
        "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null",
      async resolve(root, {id, input}, {authenticateUser, dbAdapter, loaders, memberContext}) {
        const {user} = authenticateUser()

        const subscription = await dbAdapter.subscription.getSubscriptionByID(id)

        if (!subscription) throw new NotFound('subscription', id)

        const {memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID} = input

        const memberPlan = await loaders.activeMemberPlansByID.load(memberPlanID)
        if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID)

        const paymentMethod = await loaders.activePaymentMethodsByID.load(paymentMethodID)
        if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID)

        if (monthlyAmount < memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

        if (
          !memberPlan.availablePaymentMethods.some(apm => {
            if (apm.forceAutoRenewal && !autoRenew) return false
            return (
              apm.paymentPeriodicities.includes(paymentPeriodicity) &&
              apm.paymentMethodIDs.includes(paymentMethodID)
            )
          })
        )
          throw new PaymentConfigurationNotAllowed()

        const updateSubscription = await dbAdapter.subscription.updateSubscription({
          id,
          input: {
            ...subscription,
            userID: subscription.userID ?? user.id,
            memberPlanID,
            paymentPeriodicity,
            monthlyAmount,
            autoRenew,
            paymentMethodID,
            deactivation: null
          }
        })

        if (!updateSubscription) throw new Error('Error during updateSubscription')

        // cancel open invoices if subscription is deactivated
        if (input.deactivation !== null) {
          await memberContext.cancelInvoicesForSubscription(id)
        }

        return await memberContext.handleSubscriptionChange({
          subscription: updateSubscription
        })
      }
    },

    cancelUserSubscription: {
      type: GraphQLPublicSubscription,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      description:
        'This mutation allows to cancel the users subscriptions. The deactivation date will be either paidUntil or now',
      async resolve(root, {id}, {authenticateUser, dbAdapter, memberContext}) {
        const {user} = authenticateUser()
        if (!user) throw new NotAuthenticatedError()

        const subscription = await dbAdapter.subscription.getSubscriptionByID(id)

        if (!subscription) throw new NotFound('subscription', id)

        if (subscription.deactivation !== null)
          throw new UserSubscriptionAlreadyDeactivated(subscription.deactivation.date)

        const now = new Date()
        const deactivationDate =
          subscription.paidUntil !== null && subscription.paidUntil > now
            ? subscription.paidUntil
            : now

        await memberContext.deactivateSubscriptionForUser({
          subscriptionID: subscription.id,
          deactivationDate,
          deactivationReason: SubscriptionDeactivationReason.UserSelfDeactivated
        })

        const updatedSubscription = await dbAdapter.subscription.getSubscriptionByID(id)
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
      async resolve(root, {input}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        const updateUser = await dbAdapter.user.updatePaymentProviderCustomers({
          userID: user.id,
          paymentProviderCustomers: input
        })

        if (!updateUser) throw new NotFound('User', user.id)
        return updateUser.paymentProviderCustomers
      }
    },

    createPaymentFromInvoice: {
      type: GraphQLPublicPayment,
      args: {
        input: {type: GraphQLNonNull(GraphQLPaymentFromInvoiceInput)}
      },
      description:
        'This mutation allows to create payment by taking an input of type PaymentFromInvoiceInput.',
      async resolve(
        root,
        {input},
        {authenticateUser, createPaymentWithProvider, loaders, dbAdapter}
      ) {
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

        const invoice = await dbAdapter.invoice.getInvoiceByID(invoiceID)
        if (!invoice) throw new NotFound('Invoice', invoiceID)
        const subscription = await dbAdapter.subscription.getSubscriptionByID(
          invoice.subscriptionID
        )
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
    }
  }
})
