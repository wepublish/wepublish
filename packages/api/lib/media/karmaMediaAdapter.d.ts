/// <reference types="node" />
import { URL } from 'url';
import FormData from 'form-data';
import { ImageTransformation, ImageWithFocalPoint, UploadImage } from '../db/image';
import { FileUpload } from 'graphql-upload';
import { ArrayBufferUpload, MediaAdapter } from './mediaAdapter';
export declare class MediaServerError extends Error {
    constructor(message: string);
}
export declare class KarmaMediaAdapter implements MediaAdapter {
    readonly url: URL;
    readonly token: string;
    readonly internalURL: URL;
    constructor(url: URL, token: string, internalURL?: URL);
    _uploadImage(form: FormData): Promise<UploadImage>;
    uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>;
    uploadImageFromArrayBuffer(arrayBufferUpload: Promise<ArrayBufferUpload>): Promise<UploadImage>;
    deleteImage(id: string): Promise<boolean>;
    getImageURL({ id, filename, extension, focalPoint }: ImageWithFocalPoint, transformation?: ImageTransformation): Promise<string>;
}
//# sourceMappingURL=karmaMediaAdapter.d.ts.map