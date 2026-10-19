import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload';
import { ImageTransformation } from './image-transformation.model';
import { UploadImage } from './image-upload.service';
import { Image } from '@prisma/client';

export interface ArrayBufferUpload {
  filename: string;
  mimetype: string;
  arrayBuffer: ArrayBuffer;
}

export type UploadVideo = {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  extension: string;
};

export type VideoPoster = {
  filename: string;
  mimetype: string;
  createReadStream: () => NodeJS.ReadableStream;
};

export type UploadAudio = {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  extension: string;
};

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
    image: Image,
    transformation?: ImageTransformation | undefined
  ): Promise<string>;

  abstract uploadDocument(
    fileUpload: Promise<FileUpload>
  ): Promise<UploadDocument>;

  abstract deleteDocument(id: string): Promise<boolean>;

  abstract getDocumentURL(document: {
    id: string;
    filename?: string | null;
    extension?: string;
  }): Promise<string>;

  abstract getDocumentThumbnailURL(document: { id: string }): Promise<string>;

  abstract uploadVideo(
    fileUpload: Promise<FileUpload>,
    poster?: Promise<FileUpload>
  ): Promise<UploadVideo>;

  abstract deleteVideo(id: string): Promise<boolean>;

  abstract getVideoURL(video: {
    id: string;
    filename?: string | null;
    extension?: string;
  }): Promise<string>;

  abstract getVideoPosterURL(video: { id: string }): Promise<string>;

  abstract uploadAudio(fileUpload: Promise<FileUpload>): Promise<UploadAudio>;

  abstract deleteAudio(id: string): Promise<boolean>;

  abstract getAudioURL(audio: {
    id: string;
    filename?: string | null;
    extension?: string;
  }): Promise<string>;
}
