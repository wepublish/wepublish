import { Image } from '@prisma/client';
import {
  TransformationsSchema,
  verifyImageSignature,
} from '@wepublish/media-transform-guard';
import { exportPKCS8, generateKeyPair } from 'jose';
import { NovaMediaAdapter } from './novaMediaAdapter';

const image = {
  id: 'image-1',
  focalPointX: 0.5,
  focalPointY: 0.5,
} as Image;

const createAdapter = async () => {
  const { publicKey, privateKey } = await generateKeyPair('EdDSA', {
    extractable: true,
  });

  const adapter = new NovaMediaAdapter(
    new URL('https://media.example.com'),
    await exportPKCS8(privateKey),
    'https://api.example.com',
    { quality: 1 }
  );

  return { adapter, publicKey };
};

const queryOf = (url: string) =>
  Object.fromEntries(new URL(decodeURI(url)).searchParams);

describe('NovaMediaAdapter.getImageURL', () => {
  it('asks the media server for the requested format and signs it', async () => {
    const { adapter, publicKey } = await createAdapter();

    const url = await adapter.getImageURL(image, {
      width: '500',
      format: 'jpeg',
    });
    const { sig, ...query } = queryOf(url);

    expect(query.format).toBe('jpeg');
    await expect(
      verifyImageSignature(
        publicKey,
        sig,
        image.id,
        TransformationsSchema.parse(query)
      )
    ).resolves.toBeUndefined();
  });

  it('leaves the format out when none is requested', async () => {
    const { adapter } = await createAdapter();

    const url = await adapter.getImageURL(image, { width: '500' });

    expect(queryOf(url)).not.toHaveProperty('format');
  });
});
