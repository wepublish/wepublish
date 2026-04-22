import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export const supportedDocumentMimeTypes = [
  // PDF
  'application/pdf',
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  // OpenDocument
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Text/Data
  'text/csv',
  'text/plain',
  // Archive
  'application/zip',
];

export type DocumentCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'generic';

export function getDocumentCategory(mimeType: string): DocumentCategory {
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.oasis.opendocument.text'
  )
    return 'word';
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||
    mimeType === 'text/csv'
  )
    return 'excel';
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.oasis.opendocument.presentation'
  )
    return 'powerpoint';
  if (mimeType === 'text/plain') return 'text';
  if (mimeType === 'application/zip') return 'archive';
  return 'generic';
}

export function getExtensionForMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '.docx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      '.pptx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.oasis.opendocument.text': '.odt',
    'application/vnd.oasis.opendocument.spreadsheet': '.ods',
    'application/vnd.oasis.opendocument.presentation': '.odp',
    'text/csv': '.csv',
    'text/plain': '.txt',
    'application/zip': '.zip',
  };
  return map[mimeType] ?? '';
}

export class SupportedDocumentsValidator extends FileValidator {
  constructor() {
    super({});
  }

  override async isValid(file?: IFile): Promise<boolean> {
    if (!file) {
      return false;
    }

    return supportedDocumentMimeTypes.includes(file.mimetype);
  }

  override buildErrorMessage(file: IFile): string {
    return `The file type ${file.mimetype} is not supported. Supported formats: PDF, Word, Excel, PowerPoint, OpenDocument, CSV, TXT, ZIP.`;
  }
}
