import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
export declare const getSetting: (name: string, authenticate: Context['authenticate'], setting: PrismaClient['setting']) => import(".prisma/client").Prisma.Prisma__SettingClient<import(".prisma/client").Setting | null>;
export declare const getSettings: (authenticate: Context['authenticate'], setting: PrismaClient['setting']) => import(".prisma/client").PrismaPromise<import(".prisma/client").Setting[]>;
//# sourceMappingURL=setting.private-queries.d.ts.map