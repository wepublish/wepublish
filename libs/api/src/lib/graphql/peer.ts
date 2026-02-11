import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import { PeerProfile } from '../db/peer';
import { Context } from '../context';
import { GraphQLImage } from './image';
import { ColorScalar } from '@wepublish/utils/api';
import { createProxyingResolver } from '../utility';
import { GraphQLRichText } from '@wepublish/richtext/api';

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
