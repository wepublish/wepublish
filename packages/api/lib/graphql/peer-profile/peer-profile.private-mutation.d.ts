import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const upsertPeerProfile: (input: Omit<Prisma.PeerProfileUncheckedUpdateInput, 'modifiedAt' | 'createdAt'> | Prisma.PeerProfileUncheckedCreateInput, hostURL: string, authenticate: Context['authenticate'], peerProfile: PrismaClient['peerProfile']) => Promise<{
    hostURL: string;
    id: string;
    name: string;
    themeColor: string;
    themeFontColor: string;
    callToActionURL: string;
    callToActionText: Prisma.JsonValue[];
    callToActionImageURL: string | null;
    callToActionImageID: string | null;
    logoID: string | null;
}>;
//# sourceMappingURL=peer-profile.private-mutation.d.ts.map