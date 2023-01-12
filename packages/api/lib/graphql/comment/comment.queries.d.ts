import { Comment, Prisma, PrismaClient } from '@prisma/client';
import { CommentFilter, CommentSort } from '../../db/comment';
import { ConnectionResult } from '../../db/common';
import { SortOrder } from '../queries/sort';
export declare const createCommentOrder: (field: CommentSort, sortOrder: SortOrder) => Prisma.CommentFindManyArgs['orderBy'];
export declare const createCommentFilter: (filter: Partial<CommentFilter>) => Prisma.CommentWhereInput;
export declare const getComments: (filter: Partial<CommentFilter>, sortedField: CommentSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, comment: PrismaClient['comment']) => Promise<ConnectionResult<Comment>>;
//# sourceMappingURL=comment.queries.d.ts.map