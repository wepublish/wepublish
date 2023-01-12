import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { PeerProfile } from '../db/peer';
import { Context } from '../context';
import { Peer } from '@prisma/client';
export declare const GraphQLPeerProfileInput: GraphQLInputObjectType;
export declare const GraphQLPeerProfile: GraphQLObjectType<PeerProfile, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCreatePeerInput: GraphQLInputObjectType;
export declare const GraphQLUpdatePeerInput: GraphQLInputObjectType;
export declare const GraphQLPeer: GraphQLObjectType<Peer, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=peer.d.ts.map