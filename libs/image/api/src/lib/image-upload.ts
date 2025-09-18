import { Image } from '@prisma/client';

export type UploadImage = Pick<
  Image,
  | 'id'
  | 'filename'
  | 'fileSize'
  | 'extension'
  | 'mimeType'
  | 'format'
  | 'width'
  | 'height'
>;
