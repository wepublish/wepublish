import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload';
import { ImageTransformation } from './image-transformation.model';
import { ImageWithFocalPoint } from './image-dataloader.service';
import { UploadImage } from './image-upload.service';

export interface ArrayBufferUpload {
  filename: string;
  mimetype: string;
  arrayBuffer: ArrayBuffer;
}

export type UploadDocument = {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  extension: string;
};

@Injectable()
export abstract class MediaAdapter {
  abstract uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage>;

  abstract uploadImageFromArrayBuffer(
    arrayBufferUpload: Promise<ArrayBufferUpload>
  ): Promise<UploadImage>;

  abstract deleteImage(id: string): Promise<boolean>;

  abstract getImageURL(
    image: ImageWithFocalPoint,
    transformation?: ImageTransformation | undefined
  ): Promise<string>;

  abstract uploadDocument(
    fileUpload: Promise<FileUpload>
  ): Promise<UploadDocument>;

  abstract deleteDocument(id: string): Promise<boolean>;

  abstract getDocumentURL(document: { id: string }): Promise<string>;

  abstract getDocumentThumbnailURL(document: { id: string }): Promise<string>;
}
