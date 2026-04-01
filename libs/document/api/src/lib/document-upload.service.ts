import { ForbiddenException, Injectable } from '@nestjs/common';
import { MediaAdapter } from '@wepublish/image/api';
import { PrismaClient } from '@prisma/client';
import { UploadDocumentInput } from './document.model';
import { Document } from '@prisma/client';

export type UploadDocumentResult = Pick<
  Document,
  'id' | 'filename' | 'fileSize' | 'extension' | 'mimeType'
>;

// 0 = unlimited, default 100 GB
const STORAGE_LIMIT_BYTES =
  (() => {
    const mb = parseInt(process.env['DOCUMENT_STORAGE_LIMIT_MB'] ?? '', 10);
    if (isNaN(mb) || mb < 0) return 100 * 1000; // 100 GB in MB (SI)
    return mb;
  })() *
  1000 *
  1000; // convert MB to bytes (SI)

@Injectable()
export class DocumentUploadService {
  constructor(
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter
  ) {}

  async getStorageUsage() {
    const result = await this.prisma.document.aggregate({
      _sum: { fileSize: true },
      _count: true,
    });
    return {
      usedBytes: result._sum.fileSize ?? 0,
      limitBytes: STORAGE_LIMIT_BYTES === 0 ? 0 : STORAGE_LIMIT_BYTES,
      documentCount: result._count,
    };
  }

  async uploadDocument({ file, ...input }: UploadDocumentInput) {
    // Check storage limit (0 = unlimited)
    if (STORAGE_LIMIT_BYTES > 0) {
      const { usedBytes } = await this.getStorageUsage();
      if (usedBytes >= STORAGE_LIMIT_BYTES) {
        throw new ForbiddenException(
          'Document storage limit exceeded. Please delete some documents or contact your administrator.'
        );
      }
    }

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
