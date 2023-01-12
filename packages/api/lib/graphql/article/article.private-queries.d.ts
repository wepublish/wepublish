import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { ArticleFilter, ArticleSort, ArticleWithRevisions } from '../../db/article';
export declare const getArticleById: (id: string, authenticate: Context['authenticate'], articleLoader: Context['loaders']['articles']) => Promise<ArticleWithRevisions | null>;
export declare const getArticlePreviewLink: (id: string, hours: number, authenticate: Context['authenticate'], generateJWT: Context['generateJWT'], urlAdapter: Context['urlAdapter'], articles: Context['loaders']['articles']) => Promise<string>;
export declare const getAdminArticles: (filter: Partial<ArticleFilter>, sortedField: ArticleSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], article: PrismaClient['article']) => Promise<import("../..").ConnectionResult<ArticleWithRevisions>>;
//# sourceMappingURL=article.private-queries.d.ts.map