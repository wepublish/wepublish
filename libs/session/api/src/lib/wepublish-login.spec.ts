import {
  WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID,
  WEPUBLISH_LOGIN_STAGING_CLIENT_ID,
  refusalOf,
  wepublishLoginConfig,
  type WepublishIdentity,
} from './wepublish-login';

const editor = 'https://editor-bajour.wepublish.cloud';

describe('wepublishLoginConfig', () => {
  it('uses the production client and role on production', () => {
    expect(
      wepublishLoginConfig({
        APP_ENVIRONMENT: 'production',
        EDITOR_URL: editor,
      })
    ).toEqual({
      clientId: WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID,
      role: 'login-cms-admin-production',
      redirectUri: `${editor}/login/wepublish`,
    });
  });

  it('uses the staging client with the staging role on staging', () => {
    expect(
      wepublishLoginConfig({ APP_ENVIRONMENT: 'staging', EDITOR_URL: editor })
    ).toMatchObject({
      clientId: WEPUBLISH_LOGIN_STAGING_CLIENT_ID,
      role: 'login-cms-admin-staging',
    });
  });

  it('uses the staging client with the review role on review', () => {
    expect(
      wepublishLoginConfig({ APP_ENVIRONMENT: 'review', EDITOR_URL: editor })
    ).toMatchObject({
      clientId: WEPUBLISH_LOGIN_STAGING_CLIENT_ID,
      role: 'login-cms-admin-review',
    });
  });

  it('treats any other declared environment, like local, as review', () => {
    expect(
      wepublishLoginConfig({
        APP_ENVIRONMENT: 'local',
        EDITOR_URL: 'http://localhost:3000',
      })
    ).toEqual({
      clientId: WEPUBLISH_LOGIN_STAGING_CLIENT_ID,
      role: 'login-cms-admin-review',
      redirectUri: 'http://localhost:3000/login/wepublish',
    });
  });

  it('ignores casing and padding of the environment', () => {
    expect(
      wepublishLoginConfig({
        APP_ENVIRONMENT: ' Production ',
        EDITOR_URL: editor,
      })?.role
    ).toBe('login-cms-admin-production');
  });

  it('is off when the deployment does not declare its environment', () => {
    expect(wepublishLoginConfig({ EDITOR_URL: editor })).toBeNull();
    expect(
      wepublishLoginConfig({ APP_ENVIRONMENT: ' ', EDITOR_URL: editor })
    ).toBeNull();
  });

  it('is off without an editor address to return to', () => {
    expect(wepublishLoginConfig({ APP_ENVIRONMENT: 'production' })).toBeNull();
  });

  it('drops a trailing slash of the editor address', () => {
    expect(
      wepublishLoginConfig({
        APP_ENVIRONMENT: 'production',
        EDITOR_URL: `${editor}/`,
      })?.redirectUri
    ).toBe(`${editor}/login/wepublish`);
  });
});

describe('refusalOf', () => {
  const identity: WepublishIdentity = {
    subject: 'zitadel-1',
    email: 'jane@wepublish.ch',
    emailVerified: true,
    firstName: 'Jane',
    lastName: 'Doe',
    roles: ['login-cms-admin-production'],
    amr: ['pwd', 'mfa', 'otp'],
  };

  it('lets an admin with the role and MFA in', () => {
    expect(refusalOf(identity, 'login-cms-admin-production')).toBeNull();
  });

  it('refuses an account without the role for this environment', () => {
    expect(refusalOf(identity, 'login-cms-admin-staging')).toMatch(
      /login-cms-admin-staging/
    );
  });

  it('refuses a sign-in without a second factor', () => {
    expect(
      refusalOf({ ...identity, amr: ['pwd'] }, 'login-cms-admin-production')
    ).toMatch(/two-factor/);
  });

  it('refuses an email address We.Publish has not verified', () => {
    expect(
      refusalOf(
        { ...identity, emailVerified: false },
        'login-cms-admin-production'
      )
    ).toMatch(/verified/);
  });
});
