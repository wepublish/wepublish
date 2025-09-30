import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

const supportedMimeTypes = [
  'image/webp',
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/avif',
  'image/tiff',
];

export class SupportedImagesValidator extends FileValidator {
  constructor() {
    super({});
  }

  override async isValid(file?: IFile): Promise<boolean> {
    if (!file) {
      return false;
    }

    return supportedMimeTypes.includes(file.mimetype);
  }

  override buildErrorMessage(file: IFile): string {
    return `The file type ${
      file.mimetype
    } is not supported. Only the file types ${supportedMimeTypes
      .map(mimeType => mimeType.replace('image/', ''))
      .join(', ')} are supported.`;
  }
}
