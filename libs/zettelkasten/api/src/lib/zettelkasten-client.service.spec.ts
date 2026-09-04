import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

// The config is only a DI token here; its import of the settings lib would
// otherwise pull GraphQL models that need decorator metadata.
vi.mock('@wepublish/settings/api', () => ({ SecretCrypto: class {} }));

import {
  ZettelkastenClientService,
  ZettelkastenError,
} from './zettelkasten-client.service';
import { ZettelkastenConfig } from './zettelkasten-config';

const settings = {
  enabled: true,
  url: 'http://zk.test:8095/',
  tenant: 'bajour',
  token: 'geheim',
};

const setup = async (get = vi.fn(), overrides = {}) => {
  const module = await Test.createTestingModule({
    providers: [
      ZettelkastenClientService,
      {
        provide: ZettelkastenConfig,
        useValue: {
          load: vi.fn().mockResolvedValue({ ...settings, ...overrides }),
        },
      },
      { provide: HttpService, useValue: { get } },
    ],
  }).compile();

  return { service: module.get(ZettelkastenClientService), get };
};

describe('ZettelkastenClientService', () => {
  it('calls one tool as one path under the tenant of the setting, with the bearer token', async () => {
    const get = vi.fn().mockReturnValue(of({ data: { treffer: [] } }));
    const { service } = await setup(get);

    const result = await service.call('wiki_suche', {
      suche: 'wohnschutz',
      grenze: 5,
      versatz: undefined,
    });

    expect(get).toHaveBeenCalledWith(
      'http://zk.test:8095/api/v1/mandanten/bajour/wiki_suche',
      expect.objectContaining({
        params: { suche: 'wohnschutz', grenze: 5 },
        headers: { Authorization: 'Bearer geheim' },
      })
    );
    expect(result).toEqual({ treffer: [] });
  });

  it('turns the fehler payload of the door into a GraphQL error with its code', async () => {
    const get = vi.fn().mockReturnValue(
      throwError(() => ({
        response: {
          status: 403,
          data: {
            fehler: { code: 'nicht_erlaubt', meldung: 'fremder Mandant' },
          },
        },
      }))
    );
    const { service } = await setup(get);

    await expect(
      service.call('wiki_suche', { suche: 'x' })
    ).rejects.toMatchObject({
      message: 'fremder Mandant',
      extensions: { code: 'nicht_erlaubt', status: 403 },
    });
  });

  it('never carries the transport message with host and port into the error', async () => {
    const get = vi
      .fn()
      .mockReturnValue(
        throwError(() => ({ message: 'connect ECONNREFUSED 10.0.3.14:8095' }))
      );
    const { service } = await setup(get);

    await expect(
      service.call('wiki_suche', { suche: 'x' })
    ).rejects.toMatchObject({
      message: 'The knowledge provider did not answer',
      extensions: { code: 'nicht_erreichbar' },
    });
  });

  it('keeps the transport message out of the error when the door answered without a fehler payload', async () => {
    const get = vi.fn().mockReturnValue(
      throwError(() => ({
        response: { status: 502, data: {} },
        message: 'Request failed with status code 502 at zk.intern:8095',
      }))
    );
    const { service } = await setup(get);

    await expect(
      service.call('wiki_suche', { suche: 'x' })
    ).rejects.toMatchObject({
      message: 'The knowledge provider did not answer',
      extensions: { code: 'nicht_erreichbar', status: 502 },
    });
  });

  it('refuses to call when the integration is disabled', async () => {
    const { service, get } = await setup(vi.fn(), { enabled: false });

    await expect(
      service.call('wiki_suche', { suche: 'x' })
    ).rejects.toBeInstanceOf(ZettelkastenError);
    expect(get).not.toHaveBeenCalled();
  });

  it('reports enabled only when the setting is complete', async () => {
    const complete = await setup();
    const incomplete = await setup(vi.fn(), { token: null });

    await expect(complete.service.isEnabled()).resolves.toBe(true);
    await expect(incomplete.service.isEnabled()).resolves.toBe(false);
  });
});
