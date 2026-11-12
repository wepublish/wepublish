export const WEPUBLISH_LOGIN_ISSUER = 'https://auth.wepublish.cloud';
export const WEPUBLISH_LOGIN_AUTHORIZATION_URL = `${WEPUBLISH_LOGIN_ISSUER}/oauth/v2/authorize`;
export const WEPUBLISH_LOGIN_TOKEN_URL = `${WEPUBLISH_LOGIN_ISSUER}/oauth/v2/token`;
export const WEPUBLISH_LOGIN_USERINFO_URL = `${WEPUBLISH_LOGIN_ISSUER}/oidc/v1/userinfo`;
export const WEPUBLISH_LOGIN_JWKS_URL = `${WEPUBLISH_LOGIN_ISSUER}/oauth/v2/keys`;
export const WEPUBLISH_LOGIN_ROLES_CLAIM = 'urn:zitadel:iam:org:project:roles';
export const WEPUBLISH_LOGIN_SCOPE = `openid email profile ${WEPUBLISH_LOGIN_ROLES_CLAIM}`;
export const WEPUBLISH_LOGIN_PATH = '/login/wepublish';

export const WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID = '399257510109839364';
export const WEPUBLISH_LOGIN_STAGING_CLIENT_ID = '399257571782819844';

export interface WepublishLoginConfig {
  clientId: string;
  role: string;
  redirectUri: string;
}

export interface WepublishIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
  roles: string[];
  amr: string[];
}

const STAGES: Record<string, string> = {
  production: 'production',
  staging: 'staging',
};

export function wepublishLoginConfig(
  env: Record<string, string | undefined>
): WepublishLoginConfig | null {
  const environment = env['APP_ENVIRONMENT']?.trim().toLowerCase();
  const editorUrl = env['EDITOR_URL']?.trim().replace(/\/+$/, '');

  if (!environment || !editorUrl) {
    return null;
  }

  const stage = STAGES[environment] ?? 'review';

  return {
    clientId:
      stage === 'production' ?
        WEPUBLISH_LOGIN_PRODUCTION_CLIENT_ID
      : WEPUBLISH_LOGIN_STAGING_CLIENT_ID,
    role: `login-cms-admin-${stage}`,
    redirectUri: `${editorUrl}${WEPUBLISH_LOGIN_PATH}`,
  };
}

export function refusalOf(
  identity: WepublishIdentity,
  role: string
): string | null {
  if (!identity.roles.includes(role)) {
    return `We.Publish account lacks the role ${role}`;
  }

  if (!identity.amr.includes('mfa')) {
    return 'We.Publish sign-in did not use two-factor authentication';
  }

  if (!identity.emailVerified) {
    return 'We.Publish has not verified the email address';
  }

  return null;
}
