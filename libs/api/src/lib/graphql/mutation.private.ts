import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { Context } from '../context';

import { GraphQLPeerProfile, GraphQLPeerProfileInput } from './peer';
import { upsertPeerProfile } from './peer-profile/peer-profile.private-mutation';

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      args: { input: { type: new GraphQLNonNull(GraphQLPeerProfileInput) } },
      resolve: (
        root,
        { input },
        { hostURL, authenticate, prisma: { peerProfile } }
      ) => upsertPeerProfile(input, hostURL, authenticate, peerProfile),
    },
  },
});
