import { of } from 'rxjs';
import { GatewayClient } from './client-gateway';

describe('GatewayClient', () => {
  const gateway = () => {
    const post = vi.fn().mockReturnValue(of({ data: { pixelUids: ['p'] } }));
    const client = new GatewayClient('1', 'user', 'secret', {
      post,
    } as any);

    return { client, post };
  };

  it('gives up on ProLitteris well before the claim on the pixel of an article ends', async () => {
    const { client, post } = gateway();

    await client.getTrackingPixels('A1');

    const [[, , config]] = post.mock.calls;
    expect(config.timeout).toBeGreaterThan(0);
    expect(config.timeout).toBeLessThanOrEqual(10_000);
  });

  it('still authenticates the request', async () => {
    const { client, post } = gateway();

    await client.getTrackingPixels('A1');

    const [[url, body, config]] = post.mock.calls;
    expect(url).toBe('https://owen.prolitteris.ch/rest/api/1/pixel');
    expect(body).toEqual({ amount: 1 });
    expect(config.headers.Authorization).toBe(
      `OWEN ${Buffer.from('1:user:secret').toString('base64')}`
    );
  });
});
