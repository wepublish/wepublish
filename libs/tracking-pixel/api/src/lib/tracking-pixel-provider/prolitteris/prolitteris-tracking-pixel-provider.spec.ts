import {
  SettingTrackingPixel,
  TrackingPixelProviderType,
} from '@prisma/client';
import { SecretCrypto } from '@wepublish/settings/api';
import { of } from 'rxjs';

import { ProlitterisTrackingPixelProvider } from './prolitteris-tracking-pixel-provider';

const setting = (
  overrides: Partial<SettingTrackingPixel>
): SettingTrackingPixel =>
  ({
    id: 'prolitteris',
    type: TrackingPixelProviderType.prolitteris,
    prolitteris_memberNr: '770005',
    prolitteris_username: 'user@example.ch',
    prolitteris_password: new SecretCrypto().encrypt('secret'),
    prolitteris_publisherInternalKeyDomain: null,
    prolitteris_usePublisherInternalKey: null,
    prolitteris_onlyPaidContentAccess: null,
    ...overrides,
  }) as SettingTrackingPixel;

const createProvider = (config: SettingTrackingPixel) => {
  const prisma = {
    settingTrackingPixel: {
      update: vi.fn().mockResolvedValue(config),
      findUnique: vi.fn().mockResolvedValue(config),
    },
  };
  const kv = {
    getOrLoadNs: vi.fn(
      (_ns: string, _key: string, load: () => Promise<unknown>) => load()
    ),
  };
  const post = vi.fn().mockReturnValue(
    of({
      data: { domain: 'pl02.owen.prolitteris.ch', pixelUids: ['plzm.abc'] },
    })
  );

  const provider = new ProlitterisTrackingPixelProvider(
    'prolitteris',
    prisma as any,
    kv as any,
    { post } as any
  );

  return { provider, post };
};

describe('ProlitterisTrackingPixelProvider', () => {
  const originalSecret = process.env['APP_SECRET_KEY'];

  beforeAll(() => {
    process.env['APP_SECRET_KEY'] = 'a-test-secret-of-sufficient-length';
  });

  afterAll(() => {
    process.env['APP_SECRET_KEY'] = originalSecret;
  });

  it('treats an unset publisher internal key switch as off and fetches the pixel from ProLitteris', async () => {
    const { provider, post } = createProvider(
      setting({ prolitteris_usePublisherInternalKey: null })
    );

    await expect(provider.createPixelUri('A1')).resolves.toEqual({
      pixelUid: 'plzm.abc',
      uri: 'https://pl02.owen.prolitteris.ch/na/plzm.abc',
    });
    expect(post).toHaveBeenCalledOnce();
  });

  it('builds the pixel from the member number when the publisher internal key is on', async () => {
    const { provider, post } = createProvider(
      setting({
        prolitteris_usePublisherInternalKey: true,
        prolitteris_publisherInternalKeyDomain: 'pl01.owen.prolitteris.ch',
      })
    );

    await expect(provider.createPixelUri('A1')).resolves.toEqual({
      pixelUid: 'vzm.770005-A1',
      uri: 'https://pl01.owen.prolitteris.ch/na/vzm.770005-A1',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('still needs the member number', async () => {
    const { provider } = createProvider(
      setting({ prolitteris_memberNr: null })
    );

    await expect(provider.createPixelUri('A1')).rejects.toThrow(
      /prolitteris_memberNr/
    );
  });
});
