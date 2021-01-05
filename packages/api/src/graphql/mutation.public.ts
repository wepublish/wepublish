import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLBoolean} from 'graphql'

import {Issuer} from 'openid-client'

import {GraphQLPublicSessionWithToken} from './session'
import {Context} from '../context'

import {
  InvalidCredentialsError,
  OAuth2ProviderNotFoundError,
  InvalidOAuth2TokenError,
  UserNotFoundError
} from '../error'

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
    }
  }
})
