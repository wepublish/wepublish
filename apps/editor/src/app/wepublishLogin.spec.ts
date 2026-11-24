import {
  WEPUBLISH_LOGIN_PATH,
  captureWepublishLoginResult,
  codeChallengeFor,
  startWepublishLogin,
  takeCapturedWepublishLoginResult,
  takeWepublishLoginAttempt,
} from './wepublishLogin';

const client = {
  authorizationUrl: 'https://auth.wepublish.cloud/oauth/v2/authorize',
  clientId: '399257510109839364',
  redirectUri: `https://editor.medium.ch${WEPUBLISH_LOGIN_PATH}`,
  scope: 'openid email profile urn:zitadel:iam:org:project:roles',
};

const origin = 'https://editor.medium.ch';

describe('We.Publish login', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('hashes a verifier the way RFC 7636 does for S256', async () => {
    await expect(
      codeChallengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
    ).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('sends the browser to auth.wepublish.cloud for a code that comes back in the fragment', async () => {
    const url = new URL(await startWepublishLogin({ client, origin }));

    expect(url.origin + url.pathname).toBe(client.authorizationUrl);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: client.clientId,
      redirect_uri: client.redirectUri,
      response_type: 'code',
      response_mode: 'fragment',
      scope: client.scope,
      code_challenge_method: 'S256',
    });
  });

  it('keeps the verifier in this tab and sends only its challenge', async () => {
    const url = new URL(await startWepublishLogin({ client, origin }));
    const verifier =
      takeWepublishLoginAttempt(url.searchParams.get('state'))?.verifier ?? '';

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.search).not.toContain(verifier);
    await expect(codeChallengeFor(verifier)).resolves.toBe(
      url.searchParams.get('code_challenge')
    );
  });

  it('starts every attempt with a new state and verifier', async () => {
    const start = () =>
      startWepublishLogin({ client, origin }).then(
        url => new URL(url).searchParams
      );

    const first = await start();
    const second = await start();

    expect(first.get('state')).not.toBe(second.get('state'));
    expect(first.get('code_challenge')).not.toBe(second.get('code_challenge'));
  });

  it('hands out an attempt only for its own state, and only once', async () => {
    const state = new URL(
      await startWepublishLogin({ client, origin })
    ).searchParams.get('state');

    expect(takeWepublishLoginAttempt(state)).not.toBeNull();
    expect(takeWepublishLoginAttempt(state)).toBeNull();
  });

  it('refuses a login this tab did not start', async () => {
    await startWepublishLogin({ client, origin });

    expect(takeWepublishLoginAttempt('state-of-someone-else')).toBeNull();
    expect(takeWepublishLoginAttempt(null)).toBeNull();
  });

  it('refuses to start when the code would come back to another address than this editor', async () => {
    await expect(
      startWepublishLogin({ client, origin: 'http://localhost:3000' })
    ).rejects.toThrow();
    expect(sessionStorage.length).toBe(0);
  });

  it.each([
    'http://auth.wepublish.cloud/oauth/v2/authorize',
    'javascript:alert(document.domain)//',
    'not an address',
  ])('refuses to send the browser to %s', async authorizationUrl => {
    await expect(
      startWepublishLogin({ client: { ...client, authorizationUrl }, origin })
    ).rejects.toThrow();
    expect(sessionStorage.length).toBe(0);
  });
});

describe('capturing the code We.Publish sends back', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    takeCapturedWepublishLoginResult();
  });

  it('takes code and state out of the fragment and the address bar before anything else sees them', () => {
    window.history.replaceState(
      null,
      '',
      `${WEPUBLISH_LOGIN_PATH}#code=the-code&state=state-1`
    );

    captureWepublishLoginResult();

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe(WEPUBLISH_LOGIN_PATH);
    expect(takeCapturedWepublishLoginResult()).toEqual({
      code: 'the-code',
      state: 'state-1',
    });
  });

  it('hands the code out only once', () => {
    window.history.replaceState(
      null,
      '',
      `${WEPUBLISH_LOGIN_PATH}#code=the-code&state=state-1`
    );
    captureWepublishLoginResult();
    takeCapturedWepublishLoginResult();

    expect(takeCapturedWepublishLoginResult()).toBeNull();
  });

  it('has no code when We.Publish answers with an error', () => {
    window.history.replaceState(
      null,
      '',
      `${WEPUBLISH_LOGIN_PATH}#error=access_denied&state=state-1`
    );

    captureWepublishLoginResult();

    expect(window.location.hash).toBe('');
    expect(takeCapturedWepublishLoginResult()).toBeNull();
  });

  it('leaves every other page alone', () => {
    window.history.replaceState(null, '', '/articles#section');

    captureWepublishLoginResult();

    expect(window.location.hash).toBe('#section');
    expect(takeCapturedWepublishLoginResult()).toBeNull();
  });
});
