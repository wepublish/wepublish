import { Prisma, PrismaClient } from '@prisma/client';
import { FileUpload } from 'graphql-upload';
import { Context } from '../../context';
export declare const deleteImageById: (id: string, authenticate: Context['authenticate'], image: PrismaClient['image'], mediaAdapter: Context['mediaAdapter']) => Promise<import(".prisma/client").Image & {
    focalPoint: import(".prisma/client").FocalPoint | null;
}>;
export declare type CreateImageInput = {
    file: Promise<FileUpload>;
    focalPoint: Prisma.FocalPointUncheckedCreateWithoutImageInput;
} & Omit<Prisma.ImageUncheckedCreateInput, 'modifiedAt' | 'focalPoint'>;
export declare const createImage: (input: CreateImageInput, authenticate: Context['authenticate'], mediaAdapter: Context['mediaAdapter'], imageClient: PrismaClient['image']) => Promise<import(".prisma/client").Image & {
    focalPoint: import(".prisma/client").FocalPoint | null;
}>;
export declare type UpdateImageInput = {
    focalPoint: Prisma.FocalPointUncheckedCreateWithoutImageInput;
} & Omit<Prisma.ImageUncheckedUpdateInput, 'focalPoint' | 'modifiedAt' | 'createdAt'>;
export declare const updateImage: (id: string, { focalPoint, ...input }: UpdateImageInput, authenticate: Context['authenticate'], image: PrismaClient['image']) => Prisma.Prisma__ImageClient<import(".prisma/client").Image & {
    focalPoint: import(".prisma/client").FocalPoint | null;
}>;
//# sourceMappingURL=image.private-mutation.d.ts.map