import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID
} from 'graphql'

import {Peer, PeerProfile} from '../db/peer'
import {Context} from '../context'
import {GraphQLImage} from './image'
import {GraphQLColor} from './color'
import {GraphQLDateTime} from 'graphql-iso-date'
import {createProxyingResolver, delegateToPeerSchema} from '../utility'

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
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    websiteURL: {type: GraphQLNonNull(GraphQLString)}
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
      resolve: createProxyingResolver(async (source, args, context, info) => {
        return delegateToPeerSchema(source.id, true, context, {fieldName: 'peerProfile', info})
      })
    }
  }
})
