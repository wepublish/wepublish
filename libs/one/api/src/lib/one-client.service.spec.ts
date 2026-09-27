import { JwtService } from '@wepublish/session/api';
import { OneClientService } from './one-client.service';

describe('OneClientService', () => {
  let jwtService: { generateScopedJWT: jest.Mock };
  let fetchMock: jest.Mock;
  let service: OneClientService;

  beforeEach(() => {
    jwtService = {
      generateScopedJWT: jest.fn().mockResolvedValue('signed.jwt'),
    };
    fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new OneClientService(
      jwtService as unknown as JwtService,
      'https://one.wepublish.ch'
    );
  });

  it('signs a 2-minute token bound to One and sends it as a bearer', async () => {
    await service.post('/channel/heartbeat', 'write:medium-heartbeat', {
      version: 'abc',
    });

    expect(jwtService.generateScopedJWT).toHaveBeenCalledWith({
      scope: 'write:medium-heartbeat',
      audience: 'https://one.wepublish.ch',
      subject: 'wepublish-api',
      expiresInMinutes: 2,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://one.wepublish.ch/channel/heartbeat',
      {
        method: 'POST',
        headers: {
          'x-wepublish-channel-token': 'signed.jwt',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ version: 'abc' }),
      }
    );
  });

  it('does not use the Authorization header, which Directus intercepts', async () => {
    await service.post('/channel/heartbeat', 'write:medium-heartbeat', {});

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBeUndefined();
  });

  it('throws when One rejects the request', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(
      service.post('/channel/heartbeat', 'write:medium-heartbeat', {})
    ).rejects.toThrow('403 Forbidden');
  });
});
