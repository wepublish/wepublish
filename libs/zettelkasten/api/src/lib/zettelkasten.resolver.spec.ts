import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  ZettelkastenClientService,
  ZettelkastenError,
} from './zettelkasten-client.service';
import { ZettelkastenResolver } from './zettelkasten.resolver';

vi.mock('@wepublish/settings/api', () => ({ SecretCrypto: class {} }));

describe('ZettelkastenResolver', () => {
  const setup = async () => {
    const client = {
      call: vi.fn().mockResolvedValue({ ok: true }),
      isEnabled: vi.fn().mockResolvedValue(true),
    };
    const module = await Test.createTestingModule({
      providers: [
        ZettelkastenResolver,
        { provide: ZettelkastenClientService, useValue: client },
      ],
    }).compile();

    return { resolver: module.get(ZettelkastenResolver), client };
  };

  it('maps the search query to wiki_suche with the door parameter names', async () => {
    const { resolver, client } = await setup();

    await resolver.zettelkastenSearch({
      query: 'wohnschutz',
      limit: 5,
      offset: 10,
    });

    expect(client.call).toHaveBeenCalledWith('wiki_suche', {
      suche: 'wohnschutz',
      grenze: 5,
      versatz: 10,
    });
  });

  it('maps the evidence lookup to quelle_zeigen', async () => {
    const { resolver, client } = await setup();

    await resolver.zettelkastenEvidence({
      evidence: 'rohablage/x',
      quote: 'Zitat',
    });

    expect(client.call).toHaveBeenCalledWith('quelle_zeigen', {
      beleg: 'rohablage/x',
      zitat: 'Zitat',
    });
  });

  it('answers enabled from the client', async () => {
    const { resolver } = await setup();

    await expect(resolver.zettelkastenEnabled()).resolves.toBe(true);
  });

  it('checks every anchor with one wiki_suche call, limit 1', async () => {
    const { resolver, client } = await setup();
    client.call
      .mockResolvedValueOnce({ gesamt: 3 })
      .mockResolvedValueOnce({ gesamt: 0 });

    const result = await resolver.zettelkastenAnchors({
      anchors: ['Conradin Cramer', 'Liebe Grüsse'],
    });

    expect(client.call).toHaveBeenNthCalledWith(1, 'wiki_suche', {
      suche: '"Conradin Cramer"',
      grenze: 1,
      versatz: 0,
    });
    expect(result).toEqual({
      anchors: [
        { anchor: 'Conradin Cramer', hits: 3 },
        { anchor: 'Liebe Grüsse', hits: 0 },
      ],
    });
  });

  it('reports an anchor whose call failed as unchecked and keeps the other counts', async () => {
    const { resolver, client } = await setup();
    client.call
      .mockResolvedValueOnce({ gesamt: 3 })
      .mockResolvedValueOnce({ gesamt: 0 })
      .mockRejectedValueOnce(new Error('the door timed out'))
      .mockResolvedValueOnce({ gesamt: 7 })
      .mockResolvedValueOnce({ gesamt: 1 })
      .mockResolvedValueOnce({ gesamt: 2 });

    const result = await resolver.zettelkastenAnchors({
      anchors: ['Eins', 'Zwei', 'Drei', 'Vier', 'Fuenf', 'Sechs'],
    });

    expect(result).toEqual({
      anchors: [
        { anchor: 'Eins', hits: 3 },
        { anchor: 'Zwei', hits: 0 },
        { anchor: 'Drei', hits: null },
        { anchor: 'Vier', hits: 7 },
        { anchor: 'Fuenf', hits: 1 },
        { anchor: 'Sechs', hits: 2 },
      ],
    });
    expect(client.call).toHaveBeenCalledTimes(6);
  });

  it('logs why an anchor could not be checked, with the code and the status', async () => {
    const { resolver, client } = await setup();
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(vi.fn());
    client.call.mockRejectedValue(
      new ZettelkastenError('Foreign tenant', 'kein_zugriff', 403)
    );

    await resolver.zettelkastenAnchors({ anchors: ['Conradin Cramer'] });

    // The anchor itself stays out of the log; the reason does not.
    const line = String(warn.mock.calls[0][0]);
    expect(line).toContain('kein_zugriff');
    expect(line).toContain('403');
    expect(line).not.toContain('Conradin Cramer');
    warn.mockRestore();
  });

  it('logs the class of a failure that is not a door answer', async () => {
    const { resolver, client } = await setup();
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(vi.fn());
    client.call.mockRejectedValue(new TypeError('fetch failed'));

    await resolver.zettelkastenAnchors({ anchors: ['Conradin Cramer'] });

    expect(String(warn.mock.calls[0][0])).toContain('TypeError: fetch failed');
    warn.mockRestore();
  });

  it('checks the anchors five at a time instead of all at once', async () => {
    const { resolver, client } = await setup();
    const started: string[] = [];
    const waiting: (() => void)[] = [];
    client.call.mockImplementation(
      (_tool: string, params: { suche: string }) => {
        started.push(params.suche);

        return new Promise(resolve =>
          waiting.push(() => resolve({ gesamt: 1 }))
        );
      }
    );

    const pending = resolver.zettelkastenAnchors({
      anchors: Array.from({ length: 6 }, (_, index) => `Anker ${index}`),
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(started).toHaveLength(5);

    waiting.splice(0).forEach(release => release());
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(started).toHaveLength(6);

    waiting.splice(0).forEach(release => release());
    await expect(pending).resolves.toMatchObject({
      anchors: expect.arrayContaining([{ anchor: 'Anker 5', hits: 1 }]),
    });
  });

  it('refuses more than twenty anchors', async () => {
    const { resolver } = await setup();

    await expect(
      resolver.zettelkastenAnchors({
        anchors: Array.from({ length: 21 }, (_, i) => `Anker ${i}`),
      })
    ).rejects.toThrow(/twenty/);
  });
});
