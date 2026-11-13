import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type KeyLike,
} from 'jose';
import type { Mock } from 'vitest';
import { InvalidCredentialsError } from './session.errors';
import { WepublishIdentityService } from './wepublish-identity.service';
import {
  WEPUBLISH_LOGIN_ISSUER,
  WEPUBLISH_LOGIN_ROLES_CLAIM,
  WEPUBLISH_LOGIN_TOKEN_URL,
  WEPUBLISH_LOGIN_USERINFO_URL,
} from './wepublish-login';

const clientId = '399257510109839364';
const redirectUri = 'https://editor-bajour.wepublish.cloud/login/wepublish';

const respond = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('WepublishIdentityService', () => {
  let privateKey: KeyLike;
  let strangerKey: KeyLike;
  let service: WepublishIdentityService;
  let fetchMock: Mock;

  const idToken = (
    claims: Record<string, unknown> = {},
    {
      key = privateKey,
      issuer = WEPUBLISH_LOGIN_ISSUER,
      audience = [clientId, '399257400000000000'],
    }: { key?: KeyLike; issuer?: string; audience?: string | string[] } = {}
  ) =>
    new SignJWT({ azp: clientId, amr: ['pwd', 'mfa', 'otp'], ...claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'key-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('zitadel-1')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);

  const userinfo = {
    sub: 'zitadel-1',
    email: 'jane@wepublish.ch',
    email_verified: true,
    given_name: 'Jane',
    family_name: 'Doe',
    name: 'Jane Doe',
    [WEPUBLISH_LOGIN_ROLES_CLAIM]: {
      'login-cms-admin-production': { '1234': 'wepublish.ch' },
    },
  };

  const answer = async (
    token: string | Promise<string>,
    info: unknown = userinfo
  ) => {
    fetchMock
      .mockResolvedValueOnce(
        respond({ id_token: await token, access_token: 'access-1' })
      )
      .mockResolvedValueOnce(respond(info));
  };

  const signIn = () =>
    service.signIn({
      clientId,
      redirectUri,
      code: 'code-1',
      codeVerifier: 'v',
    });

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    strangerKey = (await generateKeyPair('RS256')).privateKey;

    const jwk = await exportJWK(pair.publicKey);

    service = new WepublishIdentityService(
      createLocalJWKSet({ keys: [{ ...jwk, kid: 'key-1', alg: 'RS256' }] })
    );
  });

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('redeems the code with its PKCE verifier and no client secret', async () => {
    await answer(idToken());
    await signIn();

    const [url, init] = fetchMock.mock.calls[0];
    const body = new URLSearchParams(init.body);

    expect(url).toBe(WEPUBLISH_LOGIN_TOKEN_URL);
    expect(init.method).toBe('POST');
    expect(Object.fromEntries(body)).toEqual({
      grant_type: 'authorization_code',
      code: 'code-1',
      code_verifier: 'v',
      client_id: clientId,
      redirect_uri: redirectUri,
    });
  });

  it('reads the profile and roles from userinfo with the access token', async () => {
    await answer(idToken());

    await expect(signIn()).resolves.toEqual({
      subject: 'zitadel-1',
      email: 'jane@wepublish.ch',
      emailVerified: true,
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Jane Doe',
      roles: ['login-cms-admin-production'],
      amr: ['pwd', 'mfa', 'otp'],
    });

    expect(fetchMock.mock.calls[1][0]).toBe(WEPUBLISH_LOGIN_USERINFO_URL);
    expect(fetchMock.mock.calls[1][1].headers).toEqual({
      authorization: 'Bearer access-1',
    });
  });

  it('has no roles when userinfo carries none', async () => {
    const withoutRoles: Record<string, unknown> = { ...userinfo };
    delete withoutRoles[WEPUBLISH_LOGIN_ROLES_CLAIM];
    await answer(idToken(), withoutRoles);

    await expect(signIn()).resolves.toMatchObject({ roles: [] });
  });

  it('treats an email without email_verified as unverified', async () => {
    await answer(idToken(), { ...userinfo, email_verified: undefined });

    await expect(signIn()).resolves.toMatchObject({ emailVerified: false });
  });

  it('refuses a code the token endpoint does not accept', async () => {
    fetchMock.mockResolvedValueOnce(respond({ error: 'invalid_grant' }, 400));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses an ID token issued for another client', async () => {
    await answer(idToken({ azp: 'other' }, { audience: 'other' }));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses an ID token another client was authorized for', async () => {
    await answer(idToken({ azp: 'other' }));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses an ID token from another issuer', async () => {
    await answer(idToken({}, { issuer: 'https://auth.example.com' }));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses an ID token signed with a key We.Publish does not publish', async () => {
    await answer(idToken({}, { key: strangerKey }));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses userinfo about someone other than the ID token subject', async () => {
    await answer(idToken(), { ...userinfo, sub: 'zitadel-2' });

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses when userinfo cannot be read', async () => {
    fetchMock
      .mockResolvedValueOnce(
        respond({ id_token: await idToken(), access_token: 'access-1' })
      )
      .mockResolvedValueOnce(respond({}, 401));

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuses userinfo without an email address', async () => {
    await answer(idToken(), { ...userinfo, email: undefined });

    await expect(signIn()).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
