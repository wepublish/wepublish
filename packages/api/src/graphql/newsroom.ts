import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLBoolean
} from 'graphql'
// import {NewsroomProfile} from '../db/newsroom'
import {Context} from '../context'
import {GraphQLImage} from './image'
import {GraphQLColor} from './color'
import {GraphQLDateTime} from 'graphql-iso-date'
import {createProxyingResolver, delegateToPeerSchema} from '../utility'
import {GraphQLRichText} from './richText'
import {Newsroom} from '@prisma/client'

export const GraphQLNewsroom = new GraphQLObjectType<Newsroom, Context>({
  name: 'Newsroom',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},

    logo: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}, info) => {
        return profile.logoID ? loaders.images.load(profile.logoID) : null
      })
    },

    themeColor: {type: GraphQLColor},
    themeFontColor: {
      type: GraphQLColor,
      resolve(profile, args, {loaders}, info) {
        return profile.themeFontColor ? profile.themeFontColor : '#fff'
      }
    },
    hostURL: {type: GraphQLString},
    websiteURL: {type: GraphQLString},
    callToActionText: {type: GraphQLRichText},
    callToActionURL: {type: GraphQLString},
    callToActionImageURL: {type: GraphQLString},
    callToActionImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, {loaders}, info) => {
        return profile.callToActionImageID ? loaders.images.load(profile.callToActionImageID) : null
      })
    }
  }
})

export const GraphQLCreateNewsroomInput = new GraphQLInputObjectType({
  name: 'CreateNewsroomInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLString},
    hostURL: {type: GraphQLString},
    token: {type: GraphQLString},
    logoID: {type: GraphQLID},
    themeColor: {type: GraphQLColor},
    themeFontColor: {type: GraphQLColor},
    callToActionText: {type: GraphQLRichText},
    callToActionURL: {type: GraphQLString},
    callToActionImageURL: {type: GraphQLString},
    callToActionImageID: {type: GraphQLID}
  }
})

export const GraphQLUpdateNewsroomInput = new GraphQLInputObjectType({
  name: 'UpdateNewsroomInput',
  fields: {
    name: {type: GraphQLString},
    slug: {type: GraphQLString},
    hostURL: {type: GraphQLString},
    isDisabled: {type: GraphQLBoolean},
    token: {type: GraphQLString},
    logoID: {type: GraphQLID},
    themeColor: {type: GraphQLColor},
    themeFontColor: {type: GraphQLColor},
    callToActionText: {type: GraphQLRichText},
    callToActionURL: {type: GraphQLString},
    callToActionImageURL: {type: GraphQLString},
    callToActionImageID: {type: GraphQLID}
  }
})

export const GraphQLPeerProfile = new GraphQLObjectType<Newsroom, Context>({
  name: 'PeerProfile',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLString},
    isDisabled: {type: GraphQLBoolean},
    hostURL: {type: GraphQLString},
    profile: {
      type: GraphQLNewsroom,
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
