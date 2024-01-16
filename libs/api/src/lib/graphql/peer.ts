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
    name: {type: new GraphQLNonNull(GraphQLString)},
    logoID: {type: GraphQLID},
    themeColor: {type: new GraphQLNonNull(GraphQLColor)},
    themeFontColor: {type: new GraphQLNonNull(GraphQLColor)},
    callToActionText: {type: new GraphQLNonNull(GraphQLRichText)},
    callToActionURL: {type: new GraphQLNonNull(GraphQLString)},
    callToActionImageURL: {type: GraphQLString},
    callToActionImageID: {type: GraphQLID}
  }
})

export const GraphQLPeerProfile = new GraphQLObjectType<PeerProfile, Context>({
  name: 'PeerProfile',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},

    logo: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}) => {
        return profile.logoID ? loaders.images.load(profile.logoID) : null
      })
    },

    themeColor: {type: new GraphQLNonNull(GraphQLColor)},
    themeFontColor: {
      type: new GraphQLNonNull(GraphQLColor),
      resolve(profile) {
        return profile.themeFontColor ? profile.themeFontColor : '#fff'
      }
    },
    hostURL: {type: new GraphQLNonNull(GraphQLString)},
    websiteURL: {type: new GraphQLNonNull(GraphQLString)},
    callToActionText: {type: new GraphQLNonNull(GraphQLRichText)},
    callToActionURL: {type: new GraphQLNonNull(GraphQLString)},
    callToActionImageURL: {type: GraphQLString},
    callToActionImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}) => {
        return profile.callToActionImageID ? loaders.images.load(profile.callToActionImageID) : null
      })
    }
  }
})

export const GraphQLCreatePeerInput = new GraphQLInputObjectType({
  name: 'CreatePeerInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLString)},
    hostURL: {type: new GraphQLNonNull(GraphQLString)},
    token: {type: new GraphQLNonNull(GraphQLString)}
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
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLString)},
    isDisabled: {type: GraphQLBoolean},
    hostURL: {type: new GraphQLNonNull(GraphQLString)},
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
