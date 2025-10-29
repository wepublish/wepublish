import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import { PeerProfile } from '../db/peer';
import { Context } from '../context';
import { GraphQLImage } from './image';
import { ColorScalar } from '@wepublish/utils/api';
import { GraphQLDateTime } from 'graphql-scalars';
import { createProxyingResolver, delegateToPeerSchema } from '../utility';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Peer } from '@prisma/client';

export const GraphQLPeerProfileInput = new GraphQLInputObjectType({
  name: 'PeerProfileInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    logoID: { type: GraphQLString },
    squareLogoId: { type: GraphQLString },
    themeColor: { type: new GraphQLNonNull(ColorScalar) },
    themeFontColor: { type: new GraphQLNonNull(ColorScalar) },
    callToActionText: { type: new GraphQLNonNull(GraphQLRichText) },
    callToActionURL: { type: new GraphQLNonNull(GraphQLString) },
    callToActionImageURL: { type: GraphQLString },
    callToActionImageID: { type: GraphQLString },
  },
});

export const GraphQLPeerProfile = new GraphQLObjectType<PeerProfile, Context>({
  name: 'PeerProfile',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },

    logoID: { type: GraphQLString },
    logo: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, { loaders }) => {
        return profile.logoID ? loaders.images.load(profile.logoID) : null;
      }),
    },

    squareLogoId: { type: GraphQLString },
    squareLogo: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, { loaders }) => {
        return profile.squareLogoId ?
            loaders.images.load(profile.squareLogoId)
          : null;
      }),
    },

    themeColor: { type: new GraphQLNonNull(ColorScalar) },
    themeFontColor: {
      type: new GraphQLNonNull(ColorScalar),
      resolve(profile) {
        return profile.themeFontColor ? profile.themeFontColor : '#fff';
      },
    },
    hostURL: { type: new GraphQLNonNull(GraphQLString) },
    websiteURL: { type: new GraphQLNonNull(GraphQLString) },
    callToActionText: { type: new GraphQLNonNull(GraphQLRichText) },
    callToActionURL: { type: new GraphQLNonNull(GraphQLString) },
    callToActionImageURL: { type: GraphQLString },
    callToActionImageID: { type: GraphQLString },
    callToActionImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver((profile, args, { loaders }) => {
        return profile.callToActionImageID ?
            loaders.images.load(profile.callToActionImageID)
          : null;
      }),
    },
  },
});

export const GraphQLCreatePeerInput = new GraphQLInputObjectType({
  name: 'CreatePeerInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    hostURL: { type: new GraphQLNonNull(GraphQLString) },
    information: { type: GraphQLRichText },
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const GraphQLUpdatePeerInput = new GraphQLInputObjectType({
  name: 'UpdatePeerInput',
  fields: {
    name: { type: GraphQLString },
    slug: { type: GraphQLString },
    hostURL: { type: GraphQLString },
    isDisabled: { type: GraphQLBoolean },
    information: { type: GraphQLRichText },
    token: { type: GraphQLString },
  },
});

export const GraphQLPeer = new GraphQLObjectType<Peer, Context>({
  name: 'Peer',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    isDisabled: { type: GraphQLBoolean },
    hostURL: { type: new GraphQLNonNull(GraphQLString) },
    information: { type: GraphQLRichText },
    profile: {
      type: GraphQLPeerProfile,
      resolve: createProxyingResolver(async (source, args, context, info) => {
        const peerProfile = await delegateToPeerSchema(
          source.id,
          true,
          context,
          {
            fieldName: 'peerProfile',
            info,
          }
        );

        // TODO: Improve error handling for invalid tokens WPC-298
        return peerProfile?.extensions?.code === 'UNAUTHENTICATED' ?
            null
          : peerProfile;
      }),
    },
  },
});
