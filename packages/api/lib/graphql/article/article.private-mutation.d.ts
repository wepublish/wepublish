import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { ArticleWithRevisions } from '../../db/article';
export declare const deleteArticleById: (id: string, authenticate: Context['authenticate'], prisma: PrismaClient) => Promise<ArticleWithRevisions>;
declare type CreateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared'> & Omit<Prisma.ArticleRevisionCreateInput, 'properties' | 'revision'> & {
    properties: Prisma.MetadataPropertyCreateManyArticleRevisionInput[];
    authorIDs: Prisma.ArticleRevisionAuthorCreateManyRevisionInput['authorId'][];
    socialMediaAuthorIDs: Prisma.ArticleRevisionSocialMediaAuthorCreateManyRevisionInput['authorId'][];
};
export declare const createArticle: (input: CreateArticleInput, authenticate: Context['authenticate'], article: PrismaClient['article']) => Promise<import(".prisma/client").Article & {
    draft: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
    published: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
    pending: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
}>;
export declare const duplicateArticle: (id: string, authenticate: Context['authenticate'], articles: Context['loaders']['articles'], articleClient: PrismaClient['article']) => Promise<ArticleWithRevisions>;
export declare const unpublishArticle: (id: string, authenticate: Context['authenticate'], articleClient: PrismaClient['article']) => Promise<ArticleWithRevisions>;
export declare const publishArticle: (id: string, input: Pick<Prisma.ArticleRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>, authenticate: Context['authenticate'], articleClient: PrismaClient['article']) => Promise<ArticleWithRevisions | null>;
declare type UpdateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared'> & Omit<Prisma.ArticleRevisionCreateInput, 'revision' | 'properties'> & {
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutArticleRevisionInput[];
    authorIDs: Prisma.ArticleRevisionAuthorCreateManyRevisionInput['authorId'][];
    socialMediaAuthorIDs: Prisma.ArticleRevisionSocialMediaAuthorCreateManyRevisionInput['authorId'][];
};
export declare const updateArticle: (id: string, { properties, authorIDs, socialMediaAuthorIDs, shared, ...input }: UpdateArticleInput, authenticate: Context['authenticate'], articleClient: PrismaClient['article']) => Promise<import(".prisma/client").Article & {
    draft: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
    published: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
    pending: (import(".prisma/client").ArticleRevision & {
        properties: import(".prisma/client").MetadataProperty[];
        authors: import(".prisma/client").ArticleRevisionAuthor[];
        socialMediaAuthors: import(".prisma/client").ArticleRevisionSocialMediaAuthor[];
    }) | null;
}>;
export {};
//# sourceMappingURL=article.private-mutation.d.ts.map