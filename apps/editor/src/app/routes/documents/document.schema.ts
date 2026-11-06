import type {
  FullDocumentFragment,
  UpdateDocumentMutationVariables,
  UploadDocumentMutationVariables,
} from '@wepublish/editor/api';
import type { FormDefaultValues, FormOutput } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const documentSchema = z.object({
  title: z.string().meta({ label: 'documents.panels.title' }),
  description: z.string().meta({ label: 'documents.panels.description' }),
});

type DocumentValues = FormOutput<typeof documentSchema>;

export type DocumentFile = {
  readonly filename: string;
  readonly extension: string;
  readonly fileSize: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly url?: string;
  readonly thumbnailURL?: string;
};

export const splitFilename = (name: string) => {
  const dot = name.lastIndexOf('.');

  return dot > 0 ?
      { filename: name.slice(0, dot), extension: name.slice(dot) }
    : { filename: name, extension: '' };
};

export const fileOfUpload = (file: File): DocumentFile => ({
  ...splitFilename(file.name),
  fileSize: file.size,
});

export const fileOfDocument = (
  document: FullDocumentFragment
): DocumentFile => ({
  filename: document.filename || '',
  extension: document.extension,
  fileSize: document.fileSize,
  createdAt: document.createdAt,
  updatedAt: document.modifiedAt,
  url: document.url,
  thumbnailURL: document.thumbnailURL ?? undefined,
});

export const fromDocument = (
  document: FullDocumentFragment
): FormDefaultValues<typeof documentSchema> => ({
  title: document.title ?? '',
  description: document.description ?? '',
});

export const toUpdateDocumentVariables = (
  id: string,
  { title, description }: DocumentValues
): UpdateDocumentMutationVariables => ({
  id,
  title: title || null,
  description: description || null,
});

export const toUploadDocumentVariables = (
  file: File,
  { title, description }: DocumentValues
): UploadDocumentMutationVariables => ({
  file,
  filename: splitFilename(file.name).filename || undefined,
  title: title || undefined,
  description: description || undefined,
});
