import { Context } from '../../context';
import { PrismaClient, Prisma } from '@prisma/client';
export declare const deleteTokenById: (id: string, authenticate: Context['authenticate'], token: PrismaClient['token']) => Prisma.Prisma__TokenClient<import(".prisma/client").Token>;
export declare const createToken: (input: Omit<Prisma.TokenUncheckedCreateInput, 'token' | 'modifiedAt'>, authenticate: Context['authenticate'], token: PrismaClient['token']) => Prisma.Prisma__TokenClient<import(".prisma/client").Token>;
//# sourceMappingURL=token.private-mutation.d.ts.map