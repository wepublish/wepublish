import { Image, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { ImageFilter, ImageSort } from '../../db/image';
import { SortOrder } from '../queries/sort';
export declare const createImageOrder: (field: ImageSort, sortOrder: SortOrder) => Prisma.ImageFindManyArgs['orderBy'];
export declare const createImageFilter: (filter: Partial<ImageFilter>) => Prisma.ImageWhereInput;
export declare const getImages: (filter: Partial<ImageFilter>, sortedField: ImageSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, image: PrismaClient['image']) => Promise<ConnectionResult<Image>>;
//# sourceMappingURL=image.queries.d.ts.map