import { ModuleAsyncOptions } from '@wepublish/utils/api';
import { BaseLetterProvider } from './letter-provider/base-letter-provider';
import { PdfRenderer } from './pdf/pdf-renderer';

export const LETTERS_MODULE_OPTIONS = 'LETTERS_MODULE_OPTIONS';

export interface LettersModuleOptions {
  letterProvider: BaseLetterProvider;
  pdfRenderer: PdfRenderer;
}

export type LettersModuleAsyncOptions =
  ModuleAsyncOptions<LettersModuleOptions>;
