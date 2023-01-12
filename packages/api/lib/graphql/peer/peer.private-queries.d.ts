import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
export declare const getPeerById: (id: string, authenticate: Context['authenticate'], peerClient: Context['loaders']['peer']) => Promise<import(".prisma/client").Peer | null>;
export declare const getPeers: (authenticate: Context['authenticate'], peer: PrismaClient['peer']) => Promise<import(".prisma/client").Peer[]>;
//# sourceMappingURL=peer.private-queries.d.ts.map