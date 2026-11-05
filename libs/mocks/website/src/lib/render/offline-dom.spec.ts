import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';

describe('preventDomNetworkAccess', () => {
  let server: Server;
  let origin: string;
  const requests: string[] = [];

  beforeAll(async () => {
    server = createServer((request, response) => {
      requests.push(request.url ?? '');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.end('<p>remote</p>');
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  beforeEach(() => {
    requests.length = 0;
  });

  const waitForEvent = (element: HTMLElement) =>
    new Promise<string>(resolve => {
      element.addEventListener('load', () => resolve('load'));
      element.addEventListener('error', () => resolve('error'));
    });

  it('loads iframes as empty pages without requesting their url', async () => {
    const iframe = document.createElement('iframe');
    iframe.src = `${origin}/embed`;
    const event = waitForEvent(iframe);

    document.body.appendChild(iframe);

    expect(await event).toBe('load');
    expect(requests).toEqual([]);
    iframe.remove();
  });

  it('does not download external scripts', async () => {
    const script = document.createElement('script');
    script.src = `${origin}/embed.js`;
    const event = waitForEvent(script);

    document.body.appendChild(script);

    expect(await event).toBe('load');
    expect(requests).toEqual([]);
    script.remove();
  });

  it('still lets the test window fetch', async () => {
    const response = await fetch(`${origin}/api`);

    expect(await response.text()).toBe('<p>remote</p>');
    expect(requests).toContain('/api');
  });
});
