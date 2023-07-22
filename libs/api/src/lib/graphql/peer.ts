import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLBoolean
} from 'graphql'

import {PeerProfile} from '../db/peer'
import {Context} from '../context'
import {GraphQLImage} from './image'
import {GraphQLColor} from './color'
import {GraphQLDateTime} from 'graphql-scalars'
import {createProxyingResolver, delegateToPeerSchema} from '../utility'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Peer} from '@prisma/client'

export const GraphQLPeerProfileInput = new GraphQLInputObjectType({
  name: 'PeerProfileInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    logoID: {type: GraphQLID},
    themeColor: {type: GraphQLNonNull(GraphQLColor)},
    themeFontColor: {type: GraphQLNonNull(GraphQLColor)},
    callToActionText: {type: GraphQLNonNull(GraphQLRichText)},
    callToActionURL: {type: GraphQLNonNull(GraphQLString)},
    callToActionImageURL: {type: GraphQLString},
    callToActionImageID: {type: GraphQLID}
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
    themeFontColor: {
      type: GraphQLNonNull(GraphQLColor),
      resolve(profile, args, {loaders}, info) {
        return profile.themeFontColor ? profile.themeFontColor : '#fff'
      }
    },
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    websiteURL: {type: GraphQLNonNull(GraphQLString)},
    callToActionText: {type: GraphQLNonNull(GraphQLRichText)},
    callToActionURL: {type: GraphQLNonNull(GraphQLString)},
    callToActionImageURL: {type: GraphQLString},
    callToActionImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}, info) => {
        return profile.callToActionImageID ? loaders.images.load(profile.callToActionImageID) : null
      })
    }
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
    name: {type: GraphQLString},
    slug: {type: GraphQLString},
    hostURL: {type: GraphQLString},
    isDisabled: {type: GraphQLBoolean},
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
    isDisabled: {type: GraphQLBoolean},
    hostURL: {type: GraphQLNonNull(GraphQLString)},
    profile: {
      type: GraphQLPeerProfile,
      resolve: createProxyingResolver(async (source, args, context, info) => {
        const peerProfile = await delegateToPeerSchema(source.id, true, context, {
          fieldName: 'peerProfile',
          info
        })

        // TODO: Improve error handling for invalid tokens WPC-298
        return peerProfile?.extensions?.code === 'UNAUTHENTICATED' ? null : peerProfile
      })
    }
  }
})
