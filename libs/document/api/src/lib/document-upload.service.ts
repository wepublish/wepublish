import { Injectable } from '@nestjs/common';
import { MediaAdapter } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import { UploadDocumentInput } from './document.model';
import { Document } from '@prisma/client';

export type UploadDocumentResult = Pick<
  Document,
  'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType'
>;

@Injectable()
export class DocumentUploadService {
  constructor(
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter
  ) {}

  async uploadDocument({ file, ...input }: UploadDocumentInput) {
    const { id, ...document } = await this.mediaAdapter.uploadDocument(file);

    return this.prisma.document.create({
      data: {
        id,
        ...input,
        ...document,
        filename: input.filename ?? document.filename,
      },
    });
  }

  async deleteDocument(documentId: string) {
    await this.mediaAdapter.deleteDocument(documentId);
    await this.prisma.document.delete({ where: { id: documentId } });

    return documentId;
  }
}
