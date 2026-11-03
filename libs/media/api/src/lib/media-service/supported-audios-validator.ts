import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export const supportedAudioMimeTypes = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/aac',
  'audio/mp4',
  'audio/flac',
];

export function getExtensionForAudioMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'audio/wav': '.wav',
    'audio/webm': '.weba',
    'audio/aac': '.aac',
    'audio/mp4': '.m4a',
    'audio/flac': '.flac',
  };
  return map[mimeType] ?? '';
}

const extensionToMimeType: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.wav': 'audio/wav',
  '.weba': 'audio/webm',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
};

export function getMimeTypeForAudioExtension(
  extension: string
): string | undefined {
  return extensionToMimeType[extension.toLowerCase()];
}

export class SupportedAudiosValidator extends FileValidator {
  constructor() {
    super({});
  }

  override async isValid(file?: IFile): Promise<boolean> {
    if (!file) {
      return false;
    }

    return supportedAudioMimeTypes.includes(file.mimetype);
  }

  override buildErrorMessage(file: IFile): string {
    return `The file type ${file.mimetype} is not supported. Supported formats: MP3, OGG, WAV, WebM, AAC, M4A, FLAC.`;
  }
}
