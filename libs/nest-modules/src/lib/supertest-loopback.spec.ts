import { createServer } from 'node:http';
import request from 'supertest';

// Exercises the supertest guard in vitest.setup-nest.ts: a server that is not
// listening yet would be bound by supertest with `listen(0)`, and on macOS that
// bind can land on a port another process already holds on 127.0.0.1, so the
// request never reaches the server (a 15 s timeout on a random test). Specs
// listen on the loopback address themselves before the first request.
describe('supertest in Nest specs', () => {
  const server = createServer((_req, res) => res.end('ok'));

  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

  it('refuses a server that is not listening yet', () => {
    expect(() => request(server).get('/')).toThrow(
      /await app\.listen\(0, '127\.0\.0\.1'\)/
    );
  });

  it('drives a server that listens on the loopback address', async () => {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

    await request(server).get('/').expect(200);

    expect(server.address()).toMatchObject({
      address: '127.0.0.1',
      family: 'IPv4',
    });
  });
});
