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
  PaymentConfigurationNotAllowed
} from '../error'
import {GraphQLPublicPayment} from './payment'
import {GraphQLPaymentPeriodicity} from './memberPlan'

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
      async resolve(root, {email, password}, {dbAdapter}) {
        const user = await dbAdapter.user.getUserForCredentials({email, password})
        if (!user) throw new InvalidCredentialsError()
        return await dbAdapter.session.createUserSession(user)
      }
    },

    createSessionWithJWT: {
      type: GraphQLNonNull(GraphQLPublicSessionWithToken),
      args: {
        jwt: {type: GraphQLNonNull(GraphQLString)}
      },
      async resolve(root, {jwt}, {dbAdapter, verifyJWT}) {
        const userID = verifyJWT(jwt)

        const user = await dbAdapter.user.getUserByID(userID)
        if (!user) throw new InvalidCredentialsError()
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
        return await dbAdapter.session.createUserSession(user)
      }
    },

    revokeActiveSession: {
      type: GraphQLNonNull(GraphQLBoolean),
      args: {},
      async resolve(root, {}, {authenticateUser, dbAdapter}) {
        const session = authenticateUser()
        return session ? await dbAdapter.session.deleteUserSessionByToken(session.token) : false
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

        const user = await dbAdapter.user.createUser({
          input: {
            name,
            preferredName,
            email,
            active: false,
            properties: [],
            roleIDs: []
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
    }
  }
})
