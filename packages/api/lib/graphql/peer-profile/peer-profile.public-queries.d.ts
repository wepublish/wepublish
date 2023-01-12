import { PrismaClient } from '@prisma/client';
export declare const getPublicPeerProfile: (hostURL: string, websiteURL: string, peerProfile: PrismaClient['peerProfile']) => Promise<{
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
//# sourceMappingURL=peer-profile.public-queries.d.ts.map