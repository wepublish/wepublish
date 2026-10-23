import { Logger } from '@nestjs/common';
import {
  InMemoryDisk,
  StorageBody,
  StorageDownload,
  StorageGetOptions,
  StoragePutOptions,
} from '@nestjs/storage';
import sharp from 'sharp';
import { Readable } from 'stream';
import {
  signImageTransformations,
  TransformationsDto,
} from '@wepublish/media-transform-guard';
import { generateKeyPair } from 'jose';
import { JwksClientService } from '../authentication/jwks-client.service';
import { MediaService } from './media.service';

const STORAGE_DEFAULT_CONTENT_TYPE = 'binary/octet-stream';

class RecordingDisk extends InMemoryDisk {
  public readonly writes: string[] = [];

  public readonly reads: string[] = [];

  public override async put(
    key: string,
    body: StorageBody,
    options?: StoragePutOptions
  ) {
    const result = await super.put(key, body, options);
    this.writes.push(key);
    return result;
  }

  public override async get(
    key: string,
    options?: StorageGetOptions
  ): Promise<StorageDownload> {
    const download = await super.get(key, options);
    this.reads.push(key);
    return download;
  }

  public async contentTypeOf(key: string) {
    return await this.stat(key)
      .then(file => file.contentType)
      .catch(() => undefined);
  }

  public async seed(
    key: string,
    contentType: string,
    buffer = Buffer.from('seeded')
  ) {
    await super.put(key, buffer, { contentType });
  }
}

const createService = (publicKey?: unknown) => {
  const uploads = new RecordingDisk({});
  const transformations = new RecordingDisk({});
  const jwksClient = {
    getPublicKey: async () => {
      if (!publicKey) {
        throw new Error('The public key must not be needed');
      }

      return publicKey;
    },
  };

  const service = new MediaService(
    uploads,
    transformations,
    jwksClient as unknown as JwksClientService
  );

  return { service, uploads, transformations };
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
    'stores %s in the upload disk as %s',
    async (filename, uploadedMimeType, expectedContentType) => {
      const { service, uploads } = createService();

      await service.saveDocument(
        'doc-1',
        Buffer.from('content'),
        uploadedMimeType,
        filename
      );

      expect(await uploads.contentTypeOf(`documents/doc-1/${filename}`)).toBe(
        expectedContentType
      );
    }
  );

  it.each(documentFormats)(
    'serves %s from the public disk as %s',
    async (filename, uploadedMimeType, expectedContentType) => {
      const { service, transformations } = createService();

      await service.saveDocument(
        'doc-1',
        Buffer.from('content'),
        uploadedMimeType,
        filename
      );
      const { uri, exists } = await service.getDocumentUri('doc-1');

      expect(exists).toBe(true);
      expect(await transformations.contentTypeOf(uri)).toBe(
        expectedContentType
      );
    }
  );

  it('falls back to the file extension when the stored object has no content type', async () => {
    const { service, uploads, transformations } = createService();
    await uploads.seed(
      'documents/doc-2/report.docx',
      STORAGE_DEFAULT_CONTENT_TYPE
    );

    const { uri } = await service.getDocumentUri('doc-2');

    expect(await transformations.contentTypeOf(uri)).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('serves unknown file types as application/octet-stream', async () => {
    const { service, uploads, transformations } = createService();
    await uploads.seed(
      'documents/doc-3/backup.bin',
      STORAGE_DEFAULT_CONTENT_TYPE
    );

    const { uri } = await service.getDocumentUri('doc-3');

    expect(await transformations.contentTypeOf(uri)).toBe(
      'application/octet-stream'
    );
  });

  it('replaces a public copy that carries a wrong content type', async () => {
    const { service, transformations } = createService();
    await service.saveDocument(
      'doc-4',
      Buffer.from('{}'),
      'application/json',
      'payload.json'
    );
    await transformations.seed(
      'documents/doc-4/payload.json',
      'application/pdf'
    );

    const { uri } = await service.getDocumentUri('doc-4');

    expect(await transformations.contentTypeOf(uri)).toBe('application/json');
  });

  it('copies the document to the public disk only once', async () => {
    const { service, transformations } = createService();
    await service.saveDocument(
      'doc-5',
      Buffer.from('{}'),
      'application/json',
      'payload.json'
    );

    await service.getDocumentUri('doc-5');
    await service.getDocumentUri('doc-5');

    expect(transformations.writes).toEqual(['documents/doc-5/payload.json']);
  });

  it('renders a page preview for a pdf whose filename carries no extension', async () => {
    const { service, uploads } = createService();
    await service.saveDocument(
      'doc-7',
      MINIMAL_PDF,
      'application/pdf',
      'Jahresbericht'
    );

    await service.getDocumentThumbnailUri('doc-7');

    expect(uploads.reads).toEqual(['documents/doc-7/Jahresbericht']);
  });

  it('keeps the icon thumbnail for an archive whose filename carries no extension', async () => {
    const { service, uploads } = createService();
    await service.saveDocument(
      'doc-8',
      Buffer.from('archive'),
      'application/zip',
      'Archiv'
    );

    await service.getDocumentThumbnailUri('doc-8');

    expect(uploads.reads).toEqual([]);
  });

  it('reports a missing document as not existing', async () => {
    const { service } = createService();

    expect(await service.getDocumentUri('doc-6')).toEqual({
      uri: 'documents/doc-6',
      exists: false,
    });
  });

  it('removes a document from both disks', async () => {
    const { service, uploads, transformations } = createService();
    await service.saveDocument(
      'doc-9',
      Buffer.from('{}'),
      'application/json',
      'payload.json'
    );
    await service.getDocumentUri('doc-9');

    await service.deleteDocument('doc-9');

    expect(await uploads.exists('documents/doc-9/payload.json')).toBe(false);
    expect(await transformations.exists('documents/doc-9/payload.json')).toBe(
      false
    );
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
    const { service, uploads } = createService();

    await service.saveImage('image-1', await createImage());

    expect(await uploads.contentTypeOf('images/image-1')).toBe('image/png');
  });

  it('stores a transformation as webp', async () => {
    const { service, transformations } = createService();
    await service.saveImage('image-1', await createImage());

    const { uri } = await service.getImageUri(
      'image-1',
      {} as TransformationsDto
    );

    expect(await transformations.contentTypeOf(uri)).toBe('image/webp');
  });

  it('bakes the exif orientation into the stored image', async () => {
    const { service, uploads } = createService();

    const returned = await service.saveImage(
      'image-2',
      await createRotatedJpeg()
    );

    const stored = await collectStream(
      (await uploads.get('images/image-2')).body
    );
    const metadata = await sharp(stored).metadata();
    expect(metadata.width).toBe(4);
    expect(metadata.height).toBe(8);
    expect(metadata.orientation ?? 1).toBe(1);
    expect(returned.width).toBe(4);
    expect(returned.height).toBe(8);
    expect(await uploads.contentTypeOf('images/image-2')).toBe('image/jpeg');
  });

  it('stores an image without exif orientation byte-identical', async () => {
    const { service, uploads } = createService();
    const image = await createImage();

    await service.saveImage('image-3', image);

    const stored = await collectStream(
      (await uploads.get('images/image-3')).body
    );
    expect(stored.equals(image)).toBe(true);
  });

  it('removes an image and its transformations', async () => {
    const { service, uploads, transformations } = createService();
    await service.saveImage('image-4', await createImage());
    const { uri } = await service.getImageUri(
      'image-4',
      {} as TransformationsDto
    );

    await service.deleteImage('image-4');

    expect(await uploads.exists('images/image-4')).toBe(false);
    expect(await transformations.exists(uri)).toBe(false);
  });

  describe('signed transformations', () => {
    it('does not download the original when the signature is invalid', async () => {
      const { publicKey } = await generateKeyPair('EdDSA');
      const { service, uploads } = createService(publicKey);
      await service.saveImage('image-5', await createImage());

      await expect(
        service.getImageUri('image-5', {
          quality: 80,
          sig: 'invalid',
        } as TransformationsDto)
      ).rejects.toThrow('Invalid signature!');

      expect(uploads.reads).toEqual([]);
    });

    it('downloads and transforms concurrent requests for one variant once', async () => {
      const { publicKey, privateKey } = await generateKeyPair('EdDSA');
      const { service, uploads, transformations } = createService(publicKey);
      await service.saveImage('image-6', await createImage());
      const requested = { quality: 80 } as TransformationsDto;
      const sig = await signImageTransformations(
        privateKey,
        'image-6',
        requested
      );

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          service.getImageUri('image-6', { ...requested, sig })
        )
      );

      expect(new Set(results.map(({ uri }) => uri)).size).toBe(1);
      expect(uploads.reads).toEqual(['images/image-6']);
      expect(transformations.writes).toEqual([results[0].uri]);
    });

    it('transforms a variant again after a failed attempt', async () => {
      const { publicKey, privateKey } = await generateKeyPair('EdDSA');
      const { service } = createService(publicKey);
      await service.saveImage('image-7', await createImage());
      const requested = { quality: 80 } as TransformationsDto;
      const sig = await signImageTransformations(
        privateKey,
        'image-7',
        requested
      );

      await expect(
        service.getImageUri('image-7', { ...requested, sig: 'invalid' })
      ).rejects.toThrow('Invalid signature!');

      expect(
        (await service.getImageUri('image-7', { ...requested, sig })).exists
      ).toBe(true);
    });
  });

  describe('output format', () => {
    const createSigned = async () => {
      const { publicKey, privateKey } = await generateKeyPair('EdDSA');
      const { service, transformations } = createService(publicKey);

      const transform = async (
        imageId: string,
        requestedTransformations: TransformationsDto
      ) => {
        const sig = await signImageTransformations(
          privateKey,
          imageId,
          requestedTransformations
        );
        const { uri } = await service.getImageUri(imageId, {
          ...requestedTransformations,
          sig,
        });

        return {
          uri,
          buffer: await collectStream((await transformations.get(uri)).body),
        };
      };

      return { service, transformations, transform };
    };

    // 6x4, two frames (red, black), made with ImageMagick — sharp cannot write a multi-frame gif from raw pixels
    const createAnimation = async () =>
      Buffer.from(
        'R0lGODlhBgAEAPAAAP8AAAAAACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAABgAEAAACBISPqVcAIfkEAAoAAAAsAAAAAAYABACAAAAAAAAAAgSEj6lXADs=',
        'base64'
      );

    it.each([
      ['jpeg', 'image/jpeg'],
      ['png', 'image/png'],
      ['gif', 'image/gif'],
      ['webp', 'image/webp'],
    ] as const)(
      'stores a %s transformation as %s',
      async (format, contentType) => {
        const { service, transformations, transform } = await createSigned();
        await service.saveImage('image-1', await createImage());

        const { uri, buffer } = await transform('image-1', {
          quality: 80,
          format,
        });

        expect(await transformations.contentTypeOf(uri)).toBe(contentType);
        expect((await sharp(buffer).metadata()).format).toBe(format);
      }
    );

    it('keeps each format apart in the cache', async () => {
      const { service, transform } = await createSigned();
      await service.saveImage('image-1', await createImage());

      const jpeg = await transform('image-1', { quality: 80, format: 'jpeg' });
      const webp = await transform('image-1', { quality: 80 });

      expect(jpeg.uri).not.toBe(webp.uri);
    });

    it('puts a transparent image on white for jpeg', async () => {
      const { service, transform } = await createSigned();
      await service.saveImage(
        'transparent',
        await sharp({
          create: {
            width: 4,
            height: 4,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .png()
          .toBuffer()
      );

      const { buffer } = await transform('transparent', {
        quality: 80,
        format: 'jpeg',
      });
      const { data } = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
    });

    it('renders the first frame of an animation as jpeg', async () => {
      const { service, transform } = await createSigned();
      await service.saveImage('animated', await createAnimation());

      const { buffer } = await transform('animated', {
        quality: 80,
        format: 'jpeg',
      });
      const metadata = await sharp(buffer).metadata();

      expect(metadata.height).toBe(4);
      expect(metadata.pages ?? 1).toBe(1);
    });

    it('keeps an animation animated as gif', async () => {
      const { service, transform } = await createSigned();
      await service.saveImage('animated', await createAnimation());

      const { buffer } = await transform('animated', {
        quality: 80,
        format: 'gif',
      });

      expect((await sharp(buffer).metadata()).pages).toBe(2);
    });
  });
});
