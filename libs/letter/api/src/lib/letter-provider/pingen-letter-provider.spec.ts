import { PrismaClient, SettingLetterProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createHmac } from 'crypto';
import express from 'express';
import {
  FileUpload,
  Letters,
  OAuth,
  PingenError,
  PingenResponse,
} from 'pingen2-sdk-js';
import { LetterProviderError, LetterState } from './letter-provider.interface';
import {
  mapPingenStatusToLetterState,
  PingenLetterProvider,
  RawBodyRequest,
} from './pingen-letter-provider';

jest.mock('pingen2-sdk-js', () => {
  const actual = jest.requireActual('pingen2-sdk-js');

  return {
    ...actual,
    OAuth: jest.fn(),
    ApiRequestor: jest.fn(),
    Letters: jest.fn(),
    FileUpload: jest.fn(),
  };
});

const config: SettingLetterProvider = {
  id: 'pingen',
  createdAt: new Date(),
  modifiedAt: new Date(),
  lastLoadedAt: new Date(),
  type: 'PINGEN',
  environment: 'STAGING',
  name: 'Pingen',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  organisationId: 'org-id',
  webhookSigningKey: 'signing-key',
  autoSend: true,
};

const recipient = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

const sender = {
  name: 'Beispiel Verlag',
  street: 'Verlagsweg',
  number: '1',
  zip: '3000',
  city: 'Bern',
  country: 'CH',
};

function pingenResponse(body: unknown, statusCode = 200) {
  return new PingenResponse(JSON.stringify(body), statusCode, {});
}

const lettersMock = {
  create: jest.fn(),
  send: jest.fn(),
  cancel: jest.fn(),
  getDetails: jest.fn(),
};

const fileUploadMock = {
  requestFileUpload: jest.fn(),
};

const oauthMock = {
  getAccessToken: jest.fn(),
  invalidate: jest.fn(),
};

function createProvider() {
  const kv = {
    getOrLoadNs: jest.fn(),
    delNs: jest.fn(),
  } as unknown as KvTtlCacheService;

  const provider = new PingenLetterProvider({
    id: 'pingen',
    prisma: {} as PrismaClient,
    kv,
  });

  jest.spyOn(provider, 'getConfig').mockResolvedValue(config);

  return provider;
}

function webhookRequest(body: unknown, signingKey = 'signing-key') {
  const rawBody = Buffer.from(JSON.stringify(body));

  return {
    body,
    rawBody,
    headers: {
      signature: createHmac('sha256', signingKey).update(rawBody).digest('hex'),
    },
  } as unknown as express.Request;
}

describe('PingenLetterProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (OAuth as unknown as jest.Mock).mockImplementation(() => oauthMock);
    (Letters as unknown as jest.Mock).mockImplementation(() => lettersMock);
    (FileUpload as unknown as jest.Mock).mockImplementation(
      () => fileUploadMock
    );

    oauthMock.getAccessToken.mockResolvedValue('token-1');
  });

  describe('sendLetter', () => {
    it('uploads the file and creates the letter', async () => {
      const provider = createProvider();
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      global.fetch = fetchMock as unknown as typeof fetch;

      fileUploadMock.requestFileUpload.mockResolvedValue({
        url: 'https://objects.example/bucket/file',
        signature: 'file-signature',
      });
      lettersMock.create.mockResolvedValue(
        pingenResponse({
          data: {
            id: 'letter-1',
            type: 'letters',
            attributes: { status: 'processing' },
          },
        })
      );

      const file = Buffer.from('%PDF-1.4');
      const result = await provider.sendLetter({
        letterLogID: 'log-1',
        file,
        recipient,
        sender,
        addressPosition: 'left',
        deliveryProduct: 'cheap',
        printMode: 'simplex',
        printSpectrum: 'grayscale',
      });

      expect(result).toEqual({
        providerLetterID: 'letter-1',
        state: LetterState.accepted,
        letterData: expect.any(String),
      });

      expect(Letters).toHaveBeenCalledWith('org-id', expect.anything());

      const [putUrl, putInit] = fetchMock.mock.calls[0];
      expect(putUrl).toBe('https://objects.example/bucket/file');
      expect(putInit.method).toBe('PUT');
      expect(putInit.headers).toBeUndefined();
      expect(Buffer.from(putInit.body)).toEqual(file);

      expect(lettersMock.create).toHaveBeenCalledWith({
        fileUrl: 'https://objects.example/bucket/file',
        fileSignature: 'file-signature',
        fileOriginalName: 'log-1.pdf',
        addressPosition: 'left',
        autoSend: true,
        deliveryProduct: 'cheap',
        printMode: 'simplex',
        printSpectrum: 'grayscale',
        metaData: {
          recipient: {
            name: 'Jane Doe',
            street: 'Musterstrasse',
            pobox: '',
            number: '7',
            zip: '8000',
            city: 'Zürich',
            country: 'CH',
          },
          sender: {
            name: 'Beispiel Verlag',
            street: 'Verlagsweg',
            pobox: '',
            number: '1',
            zip: '3000',
            city: 'Bern',
            country: 'CH',
          },
        },
      });
    });

    it('falls back to the configured auto send', async () => {
      const provider = createProvider();
      global.fetch = jest
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
        }) as unknown as typeof fetch;

      fileUploadMock.requestFileUpload.mockResolvedValue({
        url: 'https://objects.example/bucket/file',
        signature: 'file-signature',
      });
      lettersMock.create.mockResolvedValue(
        pingenResponse({
          data: { id: 'letter-1', type: 'letters', attributes: {} },
        })
      );

      await provider.sendLetter({
        letterLogID: 'log-1',
        file: Buffer.from('%PDF-1.4'),
        recipient,
      });

      expect(lettersMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ autoSend: true, addressPosition: 'left' })
      );
    });

    it('does not create a letter when the upload fails', async () => {
      const provider = createProvider();
      global.fetch = jest
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 403,
        }) as unknown as typeof fetch;

      fileUploadMock.requestFileUpload.mockResolvedValue({
        url: 'https://objects.example/bucket/file',
        signature: 'file-signature',
      });

      await expect(
        provider.sendLetter({
          letterLogID: 'log-1',
          file: Buffer.from('%PDF-1.4'),
          recipient,
        })
      ).rejects.toMatchObject({
        name: 'LetterProviderError',
        statusCode: 403,
      });

      expect(lettersMock.create).not.toHaveBeenCalled();
    });

    it('reuses one connection across calls', async () => {
      const provider = createProvider();

      lettersMock.cancel.mockResolvedValue(pingenResponse({}));

      await provider.cancelLetter('letter-1');
      await provider.cancelLetter('letter-2');

      expect(OAuth).toHaveBeenCalledTimes(1);
      expect(oauthMock.getAccessToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('error mapping', () => {
    it('keeps the status and retry hint of a rate limited request', async () => {
      const provider = createProvider();

      lettersMock.cancel.mockRejectedValue(
        new PingenError('Too many requests', 429, undefined, 'req-1', 5000)
      );

      await expect(provider.cancelLetter('letter-1')).rejects.toMatchObject({
        name: 'LetterProviderError',
        statusCode: 429,
        retryAfterMs: 5000,
      });
    });
  });

  describe('dispatchLetter', () => {
    it('sends a letter that was created without auto send', async () => {
      const provider = createProvider();

      lettersMock.send.mockResolvedValue(pingenResponse({}));

      await provider.dispatchLetter({
        providerLetterID: 'letter-1',
        deliveryProduct: 'cheap',
        printMode: 'simplex',
        printSpectrum: 'grayscale',
      });

      expect(lettersMock.send).toHaveBeenCalledWith({
        letterId: 'letter-1',
        deliveryProduct: 'cheap',
        printMode: 'simplex',
        printSpectrum: 'grayscale',
      });
    });
  });

  describe('webhookForSendLetter', () => {
    it('maps a sent webhook to the dispatched state', async () => {
      const provider = createProvider();

      const statuses = await provider.webhookForSendLetter({
        req: webhookRequest({
          data: {
            id: 'webhook-1',
            type: 'webhook_sent',
            attributes: {},
            relationships: {
              deliverable: { data: { id: 'letter-1', type: 'letters' } },
            },
          },
        }),
      });

      expect(statuses).toEqual([
        {
          providerLetterID: 'letter-1',
          state: LetterState.dispatched,
          letterData: expect.any(String),
          error: undefined,
        },
      ]);
    });

    it('keeps the reason of an undeliverable webhook', async () => {
      const provider = createProvider();

      const statuses = await provider.webhookForSendLetter({
        req: webhookRequest({
          data: {
            type: 'webhook_undeliverable',
            attributes: { reason: 'Recipient unknown' },
            relationships: { letter: { data: { id: 'letter-2' } } },
          },
        }),
      });

      expect(statuses[0]).toMatchObject({
        providerLetterID: 'letter-2',
        state: LetterState.undeliverable,
        error: 'Recipient unknown',
      });
    });

    it('rejects a payload signed with the wrong key', async () => {
      const provider = createProvider();

      await expect(
        provider.webhookForSendLetter({
          req: webhookRequest(
            { data: { type: 'webhook_sent' } },
            'other-signing-key'
          ),
        })
      ).rejects.toThrow(LetterProviderError);
    });

    it('rejects a payload that was not captured as a raw body', async () => {
      const provider = createProvider();
      const req = webhookRequest({ data: { type: 'webhook_sent' } });
      delete (req as RawBodyRequest).rawBody;

      await expect(provider.webhookForSendLetter({ req })).rejects.toThrow(
        LetterProviderError
      );
    });

    it('ignores webhooks without a known event type', async () => {
      const provider = createProvider();

      const statuses = await provider.webhookForSendLetter({
        req: webhookRequest({
          data: {
            type: 'webhook_channel_subscriptions',
            relationships: { deliverable: { data: { id: 'letter-3' } } },
          },
        }),
      });

      expect(statuses).toEqual([]);
    });
  });

  describe('getMessageStates', () => {
    it('reads the current state of every letter', async () => {
      const provider = createProvider();

      lettersMock.getDetails
        .mockResolvedValueOnce(
          pingenResponse({
            data: {
              id: 'letter-1',
              type: 'letters',
              attributes: { status: 'delivered' },
            },
          })
        )
        .mockResolvedValueOnce(
          pingenResponse({
            data: {
              id: 'letter-2',
              type: 'letters',
              attributes: { status: 'something-new' },
            },
          })
        );

      const states = await provider.getMessageStates(['letter-1', 'letter-2']);

      expect(states).toEqual([
        {
          providerLetterID: 'letter-1',
          state: LetterState.delivered,
          letterData: expect.any(String),
        },
      ]);
    });
  });

  describe('mapPingenStatusToLetterState', () => {
    it.each([
      ['sent', LetterState.dispatched],
      ['DELIVERED', LetterState.delivered],
      ['undeliverable', LetterState.undeliverable],
      ['cancelled', LetterState.canceled],
      ['processing', LetterState.accepted],
    ])('maps %s', (status, expected) => {
      expect(mapPingenStatusToLetterState(status)).toBe(expected);
    });

    it('returns null for an unknown status', () => {
      expect(mapPingenStatusToLetterState('something-new')).toBeNull();
      expect(mapPingenStatusToLetterState(undefined)).toBeNull();
    });
  });
});
