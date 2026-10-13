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

describe('JwtService impersonation grants', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService(
      privateKey as string,
      publicKey as string,
      'https://api.example.com',
      'https://www.example.com'
    );
  });

  const claims = {
    userId: 'user-1',
    durationMinutes: 60,
    impersonatedBy: 'admin@wepublish.ch',
    reason: 'Ticket 4711',
    jti: 'grant-abc',
  };

  it('round-trips the claims it was given', async () => {
    const token = await service.generateImpersonationGrant(claims);

    await expect(service.verifyImpersonationGrant(token)).resolves.toEqual(
      claims
    );
  });

  it('is scoped to the impersonation audience, not the website one', async () => {
    const token = await service.generateImpersonationGrant(claims);
    const payload = decodeJwt(token);

    expect(payload.aud).toBe('impersonation');
    expect(payload.sub).toBe('user-1');
    expect(payload.jti).toBe('grant-abc');
  });

  it('expires within a minute', async () => {
    const token = await service.generateImpersonationGrant(claims);
    const payload = decodeJwt(token);

    expect(
      (payload.exp as number) - Math.floor(Date.now() / 1000)
    ).toBeLessThanOrEqual(61);
  });

  it('refuses a website-audience token', async () => {
    const other = await service.generateJWT({ id: 'user-1' });

    await expect(service.verifyImpersonationGrant(other)).resolves.toBeNull();
  });

  it('refuses a scoped channel token', async () => {
    const scoped = await service.generateScopedJWT({ scope: 'read:stats' });

    await expect(service.verifyImpersonationGrant(scoped)).resolves.toBeNull();
  });

  it('refuses a forged token', async () => {
    await expect(
      service.verifyImpersonationGrant('not.a.jwt')
    ).resolves.toBeNull();
  });
});
