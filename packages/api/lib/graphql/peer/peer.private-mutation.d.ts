import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const deletePeerById: (id: string, authenticate: Context['authenticate'], peer: PrismaClient['peer']) => Prisma.Prisma__PeerClient<import(".prisma/client").Peer>;
export declare const createPeer: (input: Omit<Prisma.PeerUncheckedCreateInput, 'modifiedAt'>, authenticate: Context['authenticate'], peer: PrismaClient['peer']) => Prisma.Prisma__PeerClient<import(".prisma/client").Peer>;
export declare const updatePeer: (id: string, input: Omit<Prisma.PeerUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>, authenticate: Context['authenticate'], peer: PrismaClient['peer']) => Prisma.Prisma__PeerClient<import(".prisma/client").Peer>;
//# sourceMappingURL=peer.private-mutation.d.ts.map