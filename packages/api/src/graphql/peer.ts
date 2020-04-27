import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLEnumType,
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

import {Peer, PeerState, PeerInfo} from '../db/peer'
import {Context} from '../context'
import {GraphQLImage} from './image'
import {GraphQLColor} from './color'

export const GraphQLPeerState = new GraphQLEnumType({
  name: 'PeerState',
  values: {
    ACCEPTED: {value: PeerState.Accepted},
    DECLINED: {value: PeerState.Declined},
    PENDING: {value: PeerState.Pending},
    REQUESTED: {value: PeerState.Requested}
  }
})

export const GraphQLPeerRequestInput = new GraphQLInputObjectType({
  name: 'PeerRequestInput',
  fields: {
    apiURL: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPeerInfo = new GraphQLObjectType<PeerInfo, Context>({
  name: 'PeerInfo',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},

    logo: {
      type: GraphQLImage,
      resolve(setting, args, {loaders}) {
        return setting.logoID && loaders.images.load(setting.logoID)
      }
    },

    themeColor: {type: GraphQLNonNull(GraphQLColor)},
    hostURL: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPeerInfoInput = new GraphQLInputObjectType({
  name: 'PeerInfoInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    logoID: {type: GraphQLID},
    themeColor: {type: GraphQLNonNull(GraphQLColor)}
  }
})

export const GraphQLPeer = new GraphQLObjectType<Peer, Context>({
  name: 'Peer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    hostURL: {type: GraphQLNonNull(GraphQLString)},
    state: {type: GraphQLNonNull(GraphQLPeerState)},

    info: {
      type: GraphQLPeerInfo,
      async resolve(root, args, context, info) {
        const fetcher: Fetcher = async ({
          query: queryDocument,
          variables,
          operationName,
          context
        }) => {
          const query = print(queryDocument)

          const fetchResult = await fetch(root.hostURL, {
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

        return delegateToSchema({
          schema: schema,
          operation: 'query',
          fieldName: 'settings',
          args: {},
          info
        })
      }
    }
  }
})
