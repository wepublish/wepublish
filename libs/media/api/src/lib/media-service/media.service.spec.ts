import { Logger } from '@nestjs/common';
import sharp from 'sharp';
import { Readable } from 'stream';
import { TransformationsDto } from '@wepublish/media-transform-guard';
import { JwksClientService } from '../authentication/jwks-client.service';
import { StorageClient } from '../storage-client/storage-client.service';
import { MediaService, MediaServiceConfig } from './media.service';

const UPLOAD_BUCKET = 'upload-bucket';
const TRANSFORMATION_BUCKET = 'transformation-bucket';
const STORAGE_DEFAULT_CONTENT_TYPE = 'binary/octet-stream';

const HEADER_METADATA_KEYS = [
  'content-type',
  'cache-control',
  'content-encoding',
  'content-disposition',
  'content-language',
];

type StoredObject = {
  buffer: Buffer;
  metaData: Record<string, string>;
};

class S3Error extends Error {
  constructor(public code: string) {
    super(code);
  }
}

class FakeStorage {
  private readonly buckets = new Map<string, Map<string, StoredObject>>([
    [UPLOAD_BUCKET, new Map()],
    [TRANSFORMATION_BUCKET, new Map()],
  ]);

  public readonly writes: string[] = [];

  public readonly reads: string[] = [];

  private bucket(bucketName: string) {
    const bucket = this.buckets.get(bucketName);
    if (!bucket) {
      throw new Error(`Unknown bucket ${bucketName}`);
    }
    return bucket;
  }

  public seed(
    bucketName: string,
    objectName: string,
    contentType: string,
    buffer = Buffer.from('seeded')
  ) {
    this.bucket(bucketName).set(objectName, {
      buffer,
      metaData: { 'content-type': contentType },
    });
  }

  public contentTypeOf(bucketName: string, objectName: string) {
    return this.bucket(bucketName).get(objectName)?.metaData['content-type'];
  }

  public writesTo(bucketName: string) {
    return this.writes.filter(write => write.startsWith(`${bucketName}:`));
  }

  public readsFrom(bucketName: string) {
    return this.reads.filter(read => read.startsWith(`${bucketName}:`));
  }

  public async saveFile(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    size: number,
    metaData: Record<string, string> = {}
  ) {
    const storedMetaData: Record<string, string> = {
      'content-type': STORAGE_DEFAULT_CONTENT_TYPE,
    };

    for (const [key, value] of Object.entries(metaData)) {
      const headerName = key.toLowerCase();
      if (HEADER_METADATA_KEYS.includes(headerName)) {
        storedMetaData[headerName] = value;
      } else {
        storedMetaData[`x-amz-meta-${headerName}`] = value;
      }
    }

    this.bucket(bucketName).set(objectName, {
      buffer,
      metaData: storedMetaData,
    });
    this.writes.push(`${bucketName}:${objectName}`);
  }

  public async hasFile(bucketName: string, objectName: string) {
    return this.bucket(bucketName).has(objectName);
  }

  public async getFileInformation(bucketName: string, objectName: string) {
    const object = this.bucket(bucketName).get(objectName);
    if (!object) {
      throw new S3Error('NotFound');
    }
    return {
      size: object.buffer.length,
      etag: 'etag',
      lastModified: new Date(0),
      metaData: object.metaData,
    };
  }

  public async getFile(bucketName: string, objectName: string) {
    const object = this.bucket(bucketName).get(objectName);
    if (!object) {
      throw new S3Error('NoSuchKey');
    }
    this.reads.push(`${bucketName}:${objectName}`);
    return Readable.from(object.buffer);
  }

  public async listFiles(bucketName: string, prefix: string) {
    return [...this.bucket(bucketName).entries()]
      .filter(([objectName]) => objectName.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([objectName, object]) => ({
        name: objectName,
        size: object.buffer.length,
        etag: 'etag',
        lastModified: new Date(0),
        prefix: '',
      }));
  }
}

const createService = () => {
  const storage = new FakeStorage();
  const config: MediaServiceConfig = {
    uploadBucket: UPLOAD_BUCKET,
    transformationBucket: TRANSFORMATION_BUCKET,
  };
  const jwksClient = {
    getPublicKey: async () => {
      throw new Error('The public key must not be needed');
    },
  };

  const service = new MediaService(
    config,
    storage as unknown as StorageClient,
    jwksClient as unknown as JwksClientService
  );

  return { service, storage };
};

const MINIMAL_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj',
    'trailer<</Root 1 0 R>>',
    '',
  ].join('\n')
);

beforeAll(() => {
  Logger.overrideLogger(false);
});

const documentFormats: [string, string, string][] = [
  ['report.pdf', 'application/pdf', 'application/pdf'],
  [
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ['report.doc', 'application/msword', 'application/msword'],
  [
    'numbers.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ['numbers.xls', 'application/vnd.ms-excel', 'application/vnd.ms-excel'],
  [
    'slides.pptx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  [
    'slides.ppt',
    'application/vnd.ms-powerpoint',
    'application/vnd.ms-powerpoint',
  ],
  [
    'text.odt',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.text',
  ],
  [
    'sheet.ods',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.spreadsheet',
  ],
  [
    'deck.odp',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.presentation',
  ],
  ['export.csv', 'text/csv', 'text/csv'],
  ['notes.txt', 'text/plain', 'text/plain'],
  ['payload.json', 'application/json', 'application/json'],
  ['feed.xml', 'application/xml', 'application/xml'],
  ['feed.xml', 'text/xml', 'text/xml'],
  ['bundle.zip', 'application/zip', 'application/zip'],
];

describe('MediaService documents', () => {
  it.each(documentFormats)(
    'stores %s in the upload bucket as %s',
    async (filename, uploadedMimeType, expectedContentType) => {
      const { service, storage } = createService();

      await service.saveDocument(
        'doc-1',
        Buffer.from('content'),
        uploadedMimeType,
        filename
      );

      expect(
        storage.contentTypeOf(UPLOAD_BUCKET, `documents/doc-1/${filename}`)
      ).toBe(expectedContentType);
    }
  );

  it.each(documentFormats)(
    'serves %s from the public bucket as %s',
    async (filename, uploadedMimeType, expectedContentType) => {
      const { service, storage } = createService();

      await service.saveDocument(
        'doc-1',
        Buffer.from('content'),
        uploadedMimeType,
        filename
      );
      const { uri, exists } = await service.getDocumentUri('doc-1');

      expect(exists).toBe(true);
      expect(storage.contentTypeOf(TRANSFORMATION_BUCKET, uri)).toBe(
        expectedContentType
      );
    }
  );

  it('falls back to the file extension when the stored object has no content type', async () => {
    const { service, storage } = createService();
    storage.seed(
      UPLOAD_BUCKET,
      'documents/doc-2/report.docx',
      STORAGE_DEFAULT_CONTENT_TYPE
    );

    const { uri } = await service.getDocumentUri('doc-2');

    expect(storage.contentTypeOf(TRANSFORMATION_BUCKET, uri)).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('serves unknown file types as application/octet-stream', async () => {
    const { service, storage } = createService();
    storage.seed(
      UPLOAD_BUCKET,
      'documents/doc-3/backup.bin',
      STORAGE_DEFAULT_CONTENT_TYPE
    );

    const { uri } = await service.getDocumentUri('doc-3');

    expect(storage.contentTypeOf(TRANSFORMATION_BUCKET, uri)).toBe(
      'application/octet-stream'
    );
  });

  it('replaces a public copy that carries a wrong content type', async () => {
    const { service, storage } = createService();
    await service.saveDocument(
      'doc-4',
      Buffer.from('{}'),
      'application/json',
      'payload.json'
    );
    storage.seed(
      TRANSFORMATION_BUCKET,
      'documents/doc-4/payload.json',
      'application/pdf'
    );

    const { uri } = await service.getDocumentUri('doc-4');

    expect(storage.contentTypeOf(TRANSFORMATION_BUCKET, uri)).toBe(
      'application/json'
    );
  });

  it('copies the document to the public bucket only once', async () => {
    const { service, storage } = createService();
    await service.saveDocument(
      'doc-5',
      Buffer.from('{}'),
      'application/json',
      'payload.json'
    );

    await service.getDocumentUri('doc-5');
    await service.getDocumentUri('doc-5');

    expect(storage.writesTo(TRANSFORMATION_BUCKET)).toEqual([
      `${TRANSFORMATION_BUCKET}:documents/doc-5/payload.json`,
    ]);
  });

  it('renders a page preview for a pdf whose filename carries no extension', async () => {
    const { service, storage } = createService();
    await service.saveDocument(
      'doc-7',
      MINIMAL_PDF,
      'application/pdf',
      'Jahresbericht'
    );

    await service.getDocumentThumbnailUri('doc-7');

    expect(storage.readsFrom(UPLOAD_BUCKET)).toEqual([
      `${UPLOAD_BUCKET}:documents/doc-7/Jahresbericht`,
    ]);
  });

  it('keeps the icon thumbnail for an archive whose filename carries no extension', async () => {
    const { service, storage } = createService();
    await service.saveDocument(
      'doc-8',
      Buffer.from('archive'),
      'application/zip',
      'Archiv'
    );

    await service.getDocumentThumbnailUri('doc-8');

    expect(storage.readsFrom(UPLOAD_BUCKET)).toEqual([]);
  });

  it('reports a missing document as not existing', async () => {
    const { service } = createService();

    expect(await service.getDocumentUri('doc-6')).toEqual({
      uri: 'documents/doc-6',
      exists: false,
    });
  });
});

describe('MediaService images', () => {
  const createImage = () =>
    sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();

  const createRotatedJpeg = () =>
    sharp({
      create: {
        width: 8,
        height: 4,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

  const collectStream = async (stream: Readable) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  };

  it('stores the uploaded image with its own content type', async () => {
    const { service, storage } = createService();

    await service.saveImage('image-1', await createImage());

    expect(storage.contentTypeOf(UPLOAD_BUCKET, 'images/image-1')).toBe(
      'image/png'
    );
  });

  it('stores a transformation as webp', async () => {
    const { service, storage } = createService();
    await service.saveImage('image-1', await createImage());

    const { uri } = await service.getImageUri(
      'image-1',
      {} as TransformationsDto
    );

    expect(storage.contentTypeOf(TRANSFORMATION_BUCKET, uri)).toBe(
      'image/webp'
    );
  });

  it('bakes the exif orientation into the stored image', async () => {
    const { service, storage } = createService();

    const returned = await service.saveImage(
      'image-2',
      await createRotatedJpeg()
    );

    const stored = await collectStream(
      await storage.getFile(UPLOAD_BUCKET, 'images/image-2')
    );
    const metadata = await sharp(stored).metadata();
    expect(metadata.width).toBe(4);
    expect(metadata.height).toBe(8);
    expect(metadata.orientation ?? 1).toBe(1);
    expect(returned.width).toBe(4);
    expect(returned.height).toBe(8);
    expect(storage.contentTypeOf(UPLOAD_BUCKET, 'images/image-2')).toBe(
      'image/jpeg'
    );
  });

  it('stores an image without exif orientation byte-identical', async () => {
    const { service, storage } = createService();
    const image = await createImage();

    await service.saveImage('image-3', image);

    const stored = await collectStream(
      await storage.getFile(UPLOAD_BUCKET, 'images/image-3')
    );
    expect(stored.equals(image)).toBe(true);
  });
});
