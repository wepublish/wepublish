import { Context } from '../../context';
import { ImageFilter, ImageSort } from '../../db/image';
import { PrismaClient } from '@prisma/client';
export declare const getImageById: (id: string, authenticate: Context['authenticate'], imageLoader: Context['loaders']['images']) => Promise<import(".prisma/client").Image | null>;
export declare const getAdminImages: (filter: Partial<ImageFilter>, sortedField: ImageSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], image: PrismaClient['image']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Image>>;
//# sourceMappingURL=image.private-queries.d.ts.map