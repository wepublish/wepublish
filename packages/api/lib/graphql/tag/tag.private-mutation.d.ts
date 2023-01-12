import { TagType, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const createTag: (tag: string, type: TagType, authenticate: Context['authenticate'], tagClient: PrismaClient['tag']) => import(".prisma/client").Prisma.Prisma__TagClient<import(".prisma/client").Tag>;
export declare const deleteTag: (tagId: string, authenticate: Context['authenticate'], tagClient: PrismaClient['tag']) => import(".prisma/client").Prisma.Prisma__TagClient<import(".prisma/client").Tag>;
export declare const updateTag: (tagId: string, tag: string, authenticate: Context['authenticate'], tagClient: PrismaClient['tag']) => import(".prisma/client").Prisma.Prisma__TagClient<import(".prisma/client").Tag>;
//# sourceMappingURL=tag.private-mutation.d.ts.map