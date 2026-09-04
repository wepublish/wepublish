import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ZettelkastenClientService } from './zettelkasten-client.service';
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

  it('refuses more than twenty anchors', async () => {
    const { resolver } = await setup();

    await expect(
      resolver.zettelkastenAnchors({
        anchors: Array.from({ length: 21 }, (_, i) => `Anker ${i}`),
      })
    ).rejects.toThrow(/twenty/);
  });
});
