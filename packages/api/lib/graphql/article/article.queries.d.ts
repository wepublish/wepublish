import { Prisma, PrismaClient } from '@prisma/client';
import { ArticleFilter, ArticleSort, ArticleWithRevisions } from '../../db/article';
import { ConnectionResult } from '../../db/common';
import { SortOrder } from '../queries/sort';
export declare const createArticleOrder: (field: ArticleSort, sortOrder: SortOrder) => Prisma.ArticleFindManyArgs['orderBy'];
export declare const createArticleFilter: (filter: Partial<ArticleFilter>) => Prisma.ArticleWhereInput;
export declare const getArticles: (filter: Partial<ArticleFilter>, sortedField: ArticleSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, article: PrismaClient['article']) => Promise<ConnectionResult<ArticleWithRevisions>>;
//# sourceMappingURL=article.queries.d.ts.map