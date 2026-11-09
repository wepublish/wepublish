import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export const supportedVideoMimeTypes = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
  'video/mpeg',
];

export function getExtensionForVideoMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'video/quicktime': '.mov',
    'video/x-m4v': '.m4v',
    'video/mpeg': '.mpeg',
  };
  return map[mimeType] ?? '';
}

const extensionToMimeType: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
};

export function getMimeTypeForVideoExtension(
  extension: string
): string | undefined {
  return extensionToMimeType[extension.toLowerCase()];
}

export class SupportedVideosValidator extends FileValidator {
  constructor() {
    super({});
  }

  override async isValid(file?: IFile): Promise<boolean> {
    if (!file) {
      return false;
    }

    return supportedVideoMimeTypes.includes(file.mimetype);
  }

  override buildErrorMessage(file: IFile): string {
    return `The file type ${file.mimetype} is not supported. Supported formats: MP4, WebM, OGG, MOV, M4V, MPEG.`;
  }
}
