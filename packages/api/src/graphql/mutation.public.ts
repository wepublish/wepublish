import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLID
} from 'graphql'

import {Issuer} from 'openid-client'
import crypto from 'crypto'

import {GraphQLPublicSessionWithToken} from './session'
import {Context} from '../context'

import {
  InvalidCredentialsError,
  OAuth2ProviderNotFoundError,
  InvalidOAuth2TokenError,
  UserNotFoundError,
  NotFound,
  MonthlyAmountNotEnough,
  PaymentConfigurationNotAllowed,
  NotActiveError,
  EmailAlreadyInUseError,
  NotAuthorisedError as NotAuthorizedError,
  NotAuthenticatedError,
  UserInputError,
  CommentLengthError,
  UserSubscriptionAlreadyDeactivated,
  InternalError
} from '../error'
import {GraphQLPaymentFromInvoiceInput, GraphQLPublicPayment} from './payment'
import {GraphQLPaymentPeriodicity} from './memberPlan'
import {
  GraphQLPaymentProviderCustomer,
  GraphQLPaymentProviderCustomerInput,
  GraphQLPublicUser,
  GraphQLPublicUserInput,
  GraphQLPublicUserSubscription,
  GraphQLPublicUserSubscriptionInput
} from './user'
import {
  GraphQLPublicCommentInput,
  GraphQLPublicCommentUpdateInput,
  GraphQLPublicComment
} from './comment'
import {CommentAuthorType, CommentState} from '../db/comment'
import {
  countRichtextChars,
  FIFTEEN_MINUTES_IN_MILLISECONDS,
  MAX_COMMENT_LENGTH,
  USER_PROPERTY_LAST_LOGIN_LINK_SEND,
  USER_PROPERTY_ORG_EMAIL
} from '../utility'
import {SendMailType} from '../mails/mailContext'
import {GraphQLSlug} from './slug'
import {logger} from '../server'

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
      async resolve(_, {input}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()
        const commentLength = countRichtextChars(0, input.text)

        if (commentLength > MAX_COMMENT_LENGTH) {
          throw new CommentLengthError()
        }

        return await dbAdapter.comment.addPublicComment({
          input: {
            ...input,
            userID: user.id,
            authorType: CommentAuthorType.VerifiedUser,
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

    registerMemberAndReceivePayment: {
      type: GraphQLNonNull(GraphQLPublicPayment),
      args: {
        name: {type: GraphQLNonNull(GraphQLString)},
        preferredName: {type: GraphQLString},
        email: {type: GraphQLNonNull(GraphQLString)},
        memberPlanID: {type: GraphQLID},
        memberPlanSlug: {type: GraphQLSlug},
        autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLID},
        paymentMethodSlug: {type: GraphQLSlug},
        successURL: {type: GraphQLString},
        failureURL: {type: GraphQLString}
      },
      description:
        'This mutation allows to register a new member, select a member plan, payment method and create an invoice. ',
      async resolve(
        root,
        {
          name,
          preferredName,
          email,
          memberPlanID,
          memberPlanSlug,
          autoRenew,
          paymentPeriodicity,
          monthlyAmount,
          paymentMethodID,
          paymentMethodSlug,
          successURL,
          failureURL
        },
        {dbAdapter, loaders, memberContext, createPaymentWithProvider}
      ) {
        if (
          (memberPlanID == null && memberPlanSlug == null) ||
          (memberPlanID != null && memberPlanSlug != null)
        ) {
          throw new UserInputError('You must provide either `memberPlanID` or `memberPlanSlug`.')
        }

        if (
          (paymentMethodID == null && paymentMethodSlug == null) ||
          (paymentMethodID != null && paymentMethodSlug != null)
        ) {
          throw new UserInputError(
            'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
          )
        }

        const memberPlan = memberPlanID
          ? await loaders.activeMemberPlansByID.load(memberPlanID)
          : await loaders.activeMemberPlansBySlug.load(memberPlanSlug)
        if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID || memberPlanSlug)

        const paymentMethod = paymentMethodID
          ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
          : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug)
        if (!paymentMethod)
          throw new NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug)

        if (monthlyAmount < memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

        if (
          !memberPlan.availablePaymentMethods.some(apm => {
            if (apm.forceAutoRenewal && !autoRenew) return false
            return (
              apm.paymentPeriodicities.includes(paymentPeriodicity) &&
              apm.paymentMethodIDs.includes(paymentMethod.id)
            )
          })
        )
          throw new PaymentConfigurationNotAllowed()

        const userExists = await dbAdapter.user.getUser(email)
        if (userExists) throw new EmailAlreadyInUseError()

        // FIXME: tempEmail is need because the register could fail and the user might try
        //  again with the same mail address. This will be fixed in WPC-595
        const tempEmail = `temp_${Date.now()}_${email}`
        const user = await dbAdapter.user.createUser({
          input: {
            name,
            preferredName,
            email: tempEmail,
            emailVerifiedAt: null,
            active: false,
            properties: [
              {
                public: false,
                key: USER_PROPERTY_ORG_EMAIL,
                value: email
              }
            ],
            roleIDs: []
          },
          password: crypto.randomBytes(48).toString('hex')
        })

        if (!user) {
          logger('mutation.public').error('Could not create new user for email "%s"', email)
          throw new InternalError()
        }

        const subscription = await dbAdapter.user.updateUserSubscription({
          userID: user.id,
          input: {
            startsAt: new Date(),
            paymentMethodID: paymentMethod.id,
            paymentPeriodicity,
            paidUntil: null,
            monthlyAmount,
            deactivatedAt: null,
            memberPlanID: memberPlan.id,
            autoRenew
          }
        })

        if (!subscription) {
          logger('mutation.public').error(
            'Could not create new subscription for userID "%s"',
            user.id
          )
          throw new InternalError()
        }

        // Create Periods, Invoices and Payment
        const invoice = await memberContext.renewSubscriptionForUser({
          userID: user.id,
          userEmail: email,
          userName: user.name,
          userSubscription: subscription
        })

        if (!invoice) {
          logger('mutation.public').error(
            'Could not create new invoice for subscription of userID "%s"',
            user.id
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

        const token = generateJWT({
          id: user.id,
          expiresInMinutes: parseInt(process.env.RESET_PASSWORD_JWT_EXPIRES_MIN as string)
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
          logger('mutation.public').warn(error, 'Updating User with ID %s failed', user.id)
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

        const {name, email, preferredName, address} = input
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
      type: GraphQLPublicUserSubscription,
      args: {
        input: {type: GraphQLNonNull(GraphQLPublicUserSubscriptionInput)}
      },
      description:
        "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivatedAt to null",
      async resolve(root, {input}, {authenticateUser, dbAdapter, loaders, memberContext}) {
        const {user} = authenticateUser()

        if (!user.subscription) throw new NotFound('user.subscription', user.id)

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

        const updateSubscription = await dbAdapter.user.updateUserSubscription({
          userID: user.id,
          input: {
            ...user.subscription,
            memberPlanID,
            paymentPeriodicity,
            monthlyAmount,
            autoRenew,
            paymentMethodID,
            deactivatedAt: null
          }
        })

        if (!updateSubscription) throw new Error('Error during updateSubscription')

        return await memberContext.handleSubscriptionChange({
          userID: user.id,
          userSubscription: updateSubscription
        })
      }
    },

    cancelUserSubscription: {
      type: GraphQLPublicUserSubscription,
      args: {},
      description:
        "This mutation allows to cancel the user's subscription. The deactivation date will be either paidUntil or now and autoRenew will be set to false.",
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const {user} = authenticateUser()

        if (!user.subscription) throw new NotFound('user.subscription', user.id)
        if (user.subscription.deactivatedAt !== null)
          throw new UserSubscriptionAlreadyDeactivated(user.subscription.deactivatedAt)

        const now = new Date()
        const deactivationDate =
          user.subscription.paidUntil !== null && user.subscription.paidUntil > now
            ? user.subscription.paidUntil
            : now
        const updateSubscription = await dbAdapter.user.updateUserSubscription({
          userID: user.id,
          input: {
            ...user.subscription,
            autoRenew: false,
            deactivatedAt: deactivationDate
          }
        })

        if (!updateSubscription) throw new Error('Error during updateSubscription')
        return updateSubscription
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

        const userInvoices = await dbAdapter.invoice.getInvoicesByUserID(user.id)
        const invoice = userInvoices.find(invoice => invoice !== null && invoice.id === invoiceID)

        if (!invoice) throw new NotFound('Invoice', invoiceID)

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
