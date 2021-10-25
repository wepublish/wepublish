import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLInt} from 'graphql'

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
  CommentLengthError
} from '../error'
import {GraphQLPaymentFromInvoiceInput, GraphQLPublicPayment} from './payment'
import {GraphQLPaymentPeriodicity} from './memberPlan'
import {
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
import {countRichtextChars, MAX_COMMENT_LENGTH} from '../utility'
import {SendMailType} from '../mails/mailContext'

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
        memberPlanID: {type: GraphQLNonNull(GraphQLString)},
        autoRenew: {type: GraphQLNonNull(GraphQLBoolean)},
        paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)},
        monthlyAmount: {type: GraphQLNonNull(GraphQLInt)},
        paymentMethodID: {type: GraphQLNonNull(GraphQLString)},
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
          autoRenew,
          paymentPeriodicity,
          monthlyAmount,
          paymentMethodID,
          successURL,
          failureURL
        },
        {dbAdapter, loaders, authenticateUser, memberContext, createPaymentWithProvider}
      ) {
        /* const userSession = authenticateUser()
        if(userSession.user) throw new Error('Can not register authenticated user') // TODO: check this again
        */

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

        const user = await dbAdapter.user.createUser({
          input: {
            name,
            preferredName,
            email,
            emailVerifiedAt: null,
            active: false,
            properties: [],
            roleIDs: [],
            authorID
          },
          password: crypto.randomBytes(48).toString('hex')
        })

        if (!user) throw new Error('Could not create user') // TODO: check if this is needed

        const subscription = await dbAdapter.user.updateUserSubscription({
          userID: user.id,
          input: {
            startsAt: new Date(),
            paymentMethodID,
            paymentPeriodicity,
            paidUntil: null,
            monthlyAmount,
            deactivatedAt: null,
            memberPlanID,
            autoRenew
          }
        })

        if (!subscription) throw new Error('Could not create subscription')

        // Create Periods, Invoices and Payment
        const invoice = await memberContext.renewSubscriptionForUser({
          userID: user.id,
          userEmail: user.email,
          userName: user.name,
          userSubscription: subscription
        })

        if (!invoice) throw new Error('Could not create invoice')

        return await createPaymentWithProvider({
          invoice,
          saveCustomer: true,
          paymentMethodID,
          successURL,
          failureURL
        })
      }
    },

    resetPassword: {
      type: GraphQLNonNull(GraphQLString),
      args: {
        email: {type: GraphQLNonNull(GraphQLString)}
      },
      description:
        "This mutation allows to reset the password by accepting the user's email and sending a login link to that email.",
      async resolve(root, {email}, {dbAdapter, generateJWT, mailContext}) {
        const user = await dbAdapter.user.getUser(email)
        if (!user) return email // TODO: implement check to avoid bots

        const token = generateJWT({id: user.id})
        await mailContext.sendMail({
          type: SendMailType.LoginLink,
          recipient: user.email,
          data: {
            url: `${process.env.WEBSITE_URL}?jwt=${token}`,
            user
          }
        })

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
        "This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription.",
      async resolve(root, {input}, {authenticateUser, dbAdapter, loaders}) {
        const {user} = authenticateUser()

        if (!user.subscription) throw new Error('User does not have a subscription') // TODO: implement better handling

        const {memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID} = input

        const memberPlan = await loaders.activeMemberPlansByID.load(memberPlanID)
        if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID)

        const paymentMethod = await loaders.activePaymentMethodsByID.load(paymentMethodID)
        if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID)

        if (monthlyAmount <= memberPlan.amountPerMonthMin) throw new MonthlyAmountNotEnough()

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
            paymentMethodID
          }
        })

        if (!updateSubscription) throw new Error('Error during updateSubscription')

        return updateSubscription
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
        {authenticateUser, createPaymentWithProvider, paymentProviders, dbAdapter}
      ) {
        const {user} = authenticateUser()
        const {invoiceID, paymentMethodID, successURL, failureURL} = input

        const userInvoices = await dbAdapter.invoice.getInvoicesByUserID(user.id)
        const invoice = userInvoices.find(invoice => invoice !== null && invoice.id === invoiceID)

        if (!invoice) throw new NotFound('Invoice', invoiceID)

        return await createPaymentWithProvider({
          paymentMethodID,
          invoice,
          saveCustomer: false,
          successURL,
          failureURL
        })
      }
    }
  }
})
