import { FocalPoint, Image } from '@prisma/client';
export declare enum ImageRotation {
    Auto = "auto",
    Rotate0 = "0",
    Rotate90 = "90",
    Rotate180 = "180",
    Rotate270 = "270"
}
export declare enum ImageOutput {
    PNG = "png",
    JPEG = "jpeg",
    WEBP = "webp"
}
export interface ImageTransformation {
    readonly width?: string | null;
    readonly height?: string | null;
    readonly rotation?: ImageRotation | null;
    readonly quality?: number | null;
    readonly output?: ImageOutput | null;
}
export interface ImageWithTransformURL extends Image {
    readonly transformURL?: string | null;
}
export declare type UploadImage = Pick<Image, 'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType' | 'format' | 'width' | 'height'>;
export declare enum ImageSort {
    CreatedAt = "modifiedAt",
    ModifiedAt = "modifiedAt"
}
export interface ImageFilter {
    readonly title?: string;
    readonly tags?: string[];
}
export declare type ImageWithFocalPoint = Image & {
    focalPoint: FocalPoint;
};
//# sourceMappingURL=image.d.ts.map