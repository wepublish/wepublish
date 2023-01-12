import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { ArticleFilter, ArticleSort, PublicArticle } from '../../db/article';
export declare const getPublishedArticles: (filter: Partial<ArticleFilter>, sortedField: ArticleSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, article: PrismaClient['article']) => Promise<{
    nodes: {
        id: string;
        preTitle?: string | null | undefined;
        title?: string | null | undefined;
        lead?: string | null | undefined;
        seoTitle?: string | null | undefined;
        slug?: string | null | undefined;
        tags?: string[] | undefined;
        canonicalUrl?: string | null | undefined;
        imageID?: string | null | undefined;
        breaking?: boolean | undefined;
        blocks?: import(".prisma/client").Prisma.JsonValue[] | undefined;
        hideAuthor?: boolean | undefined;
        socialMediaTitle?: string | null | undefined;
        socialMediaDescription?: string | null | undefined;
        socialMediaImageID?: string | null | undefined;
        revision?: number | undefined;
        createdAt?: Date | undefined;
        modifiedAt?: Date | null | undefined;
        updatedAt?: Date | null | undefined;
        publishAt?: Date | null | undefined;
        publishedAt?: Date | null | undefined;
        properties?: import(".prisma/client").MetadataProperty[] | undefined;
        authors?: import(".prisma/client").ArticleRevisionAuthor[] | undefined;
        socialMediaAuthors?: import(".prisma/client").ArticleRevisionSocialMediaAuthor[] | undefined;
        shared: boolean;
    }[];
    pageInfo: import("../..").PageInfo;
    totalCount: number;
}>;
export declare const getPublishedArticleByIdOrSlug: (id: string | null, slug: string | null, token: string | null, session: Context['session'], verifyJWT: Context['verifyJWT'], publicArticles: Context['loaders']['publicArticles'], articles: Context['loaders']['articles'], articleClient: PrismaClient['article']) => Promise<PublicArticle | null>;
//# sourceMappingURL=article.public-queries.d.ts.map