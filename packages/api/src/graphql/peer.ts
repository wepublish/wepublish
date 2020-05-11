import url from 'url'

import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID,
  print
} from 'graphql'

import {
  delegateToSchema,
  makeRemoteExecutableSchema,
  introspectSchema,
  Fetcher
} from 'graphql-tools'

import fetch from 'cross-fetch'

import {Peer, PeerProfile} from '../db/peer'
import {Context} from '../context'
import {GraphQLImage} from './image'
import {GraphQLColor} from './color'
import {GraphQLDateTime} from 'graphql-iso-date'
import {markResultAsProxied, createProxyingResolver} from '../utility'

export const GraphQLPeerProfileInput = new GraphQLInputObjectType({
  name: 'PeerProfileInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    logoID: {type: GraphQLID},
    themeColor: {type: GraphQLNonNull(GraphQLColor)}
  }
})

export const GraphQLPeerProfile = new GraphQLObjectType<PeerProfile, Context>({
  name: 'PeerProfile',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},

    logo: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}, info) => {
        return profile.logoID ? loaders.images.load(profile.logoID) : null
      })
    },

    themeColor: {type: GraphQLNonNull(GraphQLColor)},
    hostURL: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLCreatePeerInput = new GraphQLInputObjectType({
  name: 'CreatePeerInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUpdatePeerInput = new GraphQLInputObjectType({
  name: 'UpdatePeerInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    token: {type: GraphQLString}
  }
})

export const GraphQLPeer = new GraphQLObjectType<Peer, Context>({
  name: 'Peer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLString)},
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    profile: {
      type: GraphQLPeerProfile,
      resolve: createProxyingResolver(async (root, args, context, info) => {
        const fetcher: Fetcher = async ({query: queryDocument, variables, operationName}) => {
          const query = print(queryDocument)

          const fetchResult = await fetch(url.resolve(root.hostURL, 'admin'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${root.token}`
            },
            body: JSON.stringify({query, variables, operationName})
          })

          return fetchResult.json()
        }

        const schema = makeRemoteExecutableSchema({
          schema: await introspectSchema(fetcher),
          fetcher
        })

        return markResultAsProxied(
          await delegateToSchema({
            schema: schema,
            operation: 'query',
            fieldName: 'peerProfile',
            args: {},
            info
          })
        )
      })
    }
  }
})
