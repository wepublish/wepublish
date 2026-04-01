import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

const supportedMimeTypes = ['application/pdf'];

export class SupportedDocumentsValidator extends FileValidator {
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
    return `The file type ${file.mimetype} is not supported. Only PDF files are supported.`;
  }
}
