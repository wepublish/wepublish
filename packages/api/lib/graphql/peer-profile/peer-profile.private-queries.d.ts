import { PrismaClient } from '@prisma/client';
import { GraphQLResolveInfo } from 'graphql';
import { Context } from '../../context';
export declare const getAdminPeerProfile: (hostURL: string, websiteURL: string, authenticate: Context['authenticate'], peerProfile: PrismaClient['peerProfile']) => Promise<{
    hostURL: string;
    websiteURL: string;
    id: string;
    name: string;
    themeColor: string;
    themeFontColor: string;
    callToActionURL: string;
    callToActionText: import(".prisma/client").Prisma.JsonValue[];
    callToActionImageURL: string | null;
    callToActionImageID: string | null;
    logoID: string | null;
} | {
    hostURL: string;
    websiteURL: string;
    name: string;
    themeColor: string;
    themeFontColor: string;
    callToActionURL: string;
    callToActionText: never[];
    callToActionImageID: string;
    callToActionImageURL: string;
}>;
export declare const getRemotePeerProfile: (hostURL: string, token: string, authenticate: Context['authenticate'], info: GraphQLResolveInfo, setting: PrismaClient['setting']) => Promise<any>;
//# sourceMappingURL=peer-profile.private-queries.d.ts.map