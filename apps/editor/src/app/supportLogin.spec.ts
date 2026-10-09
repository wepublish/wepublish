import {
  SUPPORT_LOGIN_PATH,
  captureSupportLoginResult,
  codeChallengeFor,
  startSupportLogin,
  takeCapturedSupportLoginResult,
  takeSupportLoginAttempt,
} from './supportLogin';

describe('support login', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('hashes a verifier the way RFC 7636 does for S256', async () => {
    await expect(
      codeChallengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
    ).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('sends the browser to the support login with this editor as the only way back', async () => {
    const url = new URL(
      await startSupportLogin({
        oneUrl: 'https://one-admin.wepublish.cloud/',
        origin: 'https://editor.medium.ch',
      })
    );

    expect(url.origin + url.pathname).toBe(
      'https://one-admin.wepublish.cloud/impersonation/support-login'
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      `https://editor.medium.ch${SUPPORT_LOGIN_PATH}`
    );
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('keeps the verifier in this tab and sends only its challenge', async () => {
    const url = new URL(
      await startSupportLogin({
        oneUrl: 'https://one-admin.wepublish.cloud',
        origin: 'https://editor.medium.ch',
      })
    );
    const verifier =
      takeSupportLoginAttempt(url.searchParams.get('state'))?.verifier ?? '';

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.search).not.toContain(verifier);
    await expect(codeChallengeFor(verifier)).resolves.toBe(
      url.searchParams.get('code_challenge')
    );
  });

  it('starts every attempt with a new state and verifier', async () => {
    const start = () =>
      startSupportLogin({
        oneUrl: 'https://one-admin.wepublish.cloud',
        origin: 'https://editor.medium.ch',
      }).then(url => new URL(url).searchParams);

    const first = await start();
    const second = await start();

    expect(first.get('state')).not.toBe(second.get('state'));
    expect(first.get('code_challenge')).not.toBe(second.get('code_challenge'));
  });

  it('hands out an attempt only for its own state, and only once', async () => {
    const state = new URL(
      await startSupportLogin({
        oneUrl: 'https://one-admin.wepublish.cloud',
        origin: 'https://editor.medium.ch',
      })
    ).searchParams.get('state');

    expect(takeSupportLoginAttempt(state)).not.toBeNull();
    expect(takeSupportLoginAttempt(state)).toBeNull();
  });

  it('refuses a login this tab did not start', async () => {
    await startSupportLogin({
      oneUrl: 'https://one-admin.wepublish.cloud',
      origin: 'https://editor.medium.ch',
    });

    expect(takeSupportLoginAttempt('state-of-someone-else')).toBeNull();
    expect(takeSupportLoginAttempt(null)).toBeNull();
  });
});

describe('capturing the code the support login sends back', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    takeCapturedSupportLoginResult();
  });

  it('takes code and state out of the fragment and the address bar before anything else sees them', () => {
    window.history.replaceState(
      null,
      '',
      `${SUPPORT_LOGIN_PATH}#code=the-grant&state=state-1`
    );

    captureSupportLoginResult();

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe(SUPPORT_LOGIN_PATH);
    expect(takeCapturedSupportLoginResult()).toEqual({
      code: 'the-grant',
      state: 'state-1',
    });
  });

  it('hands the code out only once', () => {
    window.history.replaceState(
      null,
      '',
      `${SUPPORT_LOGIN_PATH}#code=the-grant&state=state-1`
    );
    captureSupportLoginResult();
    takeCapturedSupportLoginResult();

    expect(takeCapturedSupportLoginResult()).toBeNull();
  });

  it('leaves every other page alone', () => {
    window.history.replaceState(null, '', '/articles#section');

    captureSupportLoginResult();

    expect(window.location.hash).toBe('#section');
    expect(takeCapturedSupportLoginResult()).toBeNull();
  });
});
