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
}
