import { generateKeyPairSync } from 'crypto';
import { decodeJwt } from 'jose';
import { JwtService } from './jwt.service';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('JwtService.generateScopedJWT', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService(
      privateKey as string,
      publicKey as string,
      'https://api.example.com',
      'https://www.example.com'
    );
  });

  it('defaults to the website audience and the website subject', async () => {
    const token = await service.generateScopedJWT({
      scope: 'read:website-settings',
    });
    const payload = decodeJwt(token);

    expect(payload.aud).toBe('https://www.example.com');
    expect(payload.sub).toBe('website-service');
  });

  it('uses the supplied audience and subject', async () => {
    const token = await service.generateScopedJWT({
      scope: 'write:medium-heartbeat',
      audience: 'https://one.wepublish.ch',
      subject: 'wepublish-api',
    });
    const payload = decodeJwt(token);

    expect(payload.aud).toBe('https://one.wepublish.ch');
    expect(payload.sub).toBe('wepublish-api');
    expect(payload.iss).toBe('https://api.example.com');
    expect(payload['scope']).toBe('write:medium-heartbeat');
  });
});
