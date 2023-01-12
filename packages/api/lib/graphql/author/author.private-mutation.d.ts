import { Context } from '../../context';
import { PrismaClient, Prisma } from '@prisma/client';
export declare const deleteAuthorById: (id: string, authenticate: Context['authenticate'], author: PrismaClient['author']) => Prisma.Prisma__AuthorClient<import(".prisma/client").Author>;
declare type CreateAuthorInput = Omit<Prisma.AuthorUncheckedCreateInput, 'links' | 'modifiedAt'> & {
    links: Prisma.AuthorsLinksUncheckedCreateWithoutAuthorInput[];
};
export declare const createAuthor: ({ links, ...input }: CreateAuthorInput, authenticate: Context['authenticate'], author: PrismaClient['author']) => Prisma.Prisma__AuthorClient<import(".prisma/client").Author & {
    links: import(".prisma/client").AuthorsLinks[];
}>;
declare type UpdateAuthorInput = Omit<Prisma.AuthorUncheckedUpdateInput, 'links' | 'modifiedAt' | 'createdAt'> & {
    links: Prisma.AuthorsLinksUncheckedCreateWithoutAuthorInput[];
};
export declare const updateAuthor: (id: string, { links, ...input }: UpdateAuthorInput, authenticate: Context['authenticate'], author: PrismaClient['author']) => Prisma.Prisma__AuthorClient<import(".prisma/client").Author & {
    links: import(".prisma/client").AuthorsLinks[];
}>;
export {};
//# sourceMappingURL=author.private-mutation.d.ts.map