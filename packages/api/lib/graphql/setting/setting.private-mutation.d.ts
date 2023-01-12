import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { UpdateSettingArgs } from '../../db/setting';
export declare const updateSettings: (value: UpdateSettingArgs[], authenticate: Context['authenticate'], prisma: PrismaClient) => Promise<import(".prisma/client").Setting[]>;
//# sourceMappingURL=setting.private-mutation.d.ts.map