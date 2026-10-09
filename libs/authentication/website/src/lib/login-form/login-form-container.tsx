import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  CheckLoginOtpDocument,
  LoginWithCodeDocument,
  LoginWithCredentialsDocument,
  LoginWithEmailDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderLoginFormProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../session.context';
import { useLoginLinkCooldown } from './login-link-cooldown';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type LoginFormContainerProps = BuilderContainerProps & {
  afterLoginCallback?: () => void;
  defaults?: BuilderLoginFormProps['defaults'];
  disablePasswordLogin?: BuilderLoginFormProps['disablePasswordLogin'];
};

export function LoginFormContainer({
  className,
  afterLoginCallback,
  defaults,
  disablePasswordLogin,
}: LoginFormContainerProps) {
  const { LoginForm } = useWebsiteBuilder();
  const { setToken } = useUser();
  const [otpRequired, setOtpRequired] = useState(false);
  const [totpRedirectToPassword, setTotpRedirectToPassword] = useState(false);
  const [loginLinkCooldownSeconds, markLoginLinkSent] = useLoginLinkCooldown();
  // Login codes are opt-in per medium; the API refuses them while off.
  const { data: settingsData } = useQuery(SettingListDocument);
  const loginCodeEnabled =
    settingsData?.settings.find(
      setting => setting.name === SettingName.LoginCodeEnabled
    )?.value === true;
  const [codeChallengeRequired, setCodeChallengeRequired] = useState(false);
  const [loginWithCode, withCode] = useMutation(LoginWithCodeDocument, {
    onCompleted(data) {
      setToken({
        __typename: 'SessionWithTokenWithoutUser',
        createdAt: data.createSessionWithLoginCode.createdAt,
        expiresAt: data.createSessionWithLoginCode.expiresAt,
        token: data.createSessionWithLoginCode.token,
      });
    },
    onError(error) {
      setCodeChallengeRequired(error.message.includes('CHALLENGE_REQUIRED'));
    },
  });

  // Check if redirected from a failed JWT login (2FA user)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('totpRequired') === '1') {
        setTotpRedirectToPassword(true);
        setOtpRequired(true);
      }
    }
  }, []);
  const [checkLoginOtp] = useLazyQuery(CheckLoginOtpDocument);
  const [loginWithEmail, withEmail] = useMutation(LoginWithEmailDocument, {
    onCompleted() {
      markLoginLinkSent();
    },
  });
  const [loginWithCredentials, withCredentials] = useMutation(
    LoginWithCredentialsDocument,
    {
      onCompleted(data) {
        setToken({
          __typename: 'SessionWithTokenWithoutUser',
          createdAt: data.createSession.createdAt,
          expiresAt: data.createSession.expiresAt,
          token: data.createSession.token,
        });
      },
    }
  );

  const handleEmailChange = useCallback(
    (email: string) => {
      setTotpRedirectToPassword(false);

      if (!isValidEmail(email)) {
        setOtpRequired(false);
        return;
      }

      const timeout = setTimeout(async () => {
        const result = await checkLoginOtp({ variables: { email } });
        setOtpRequired(result.data?.checkLoginOtp ?? false);
      }, 300);

      return () => clearTimeout(timeout);
    },
    [checkLoginOtp]
  );

  const handleSubmitLoginWithEmail = useCallback(
    (email: string) => {
      // TOTP users can still request a login link — the JWT flow
      // will prompt for the TOTP code when they follow it.
      loginWithEmail({ variables: { email } });
    },
    [loginWithEmail]
  );

  return (
    <LoginForm
      // The form reads `defaults` once, so it starts over when the setting
      // arrives and a link carrying a code can open the code form.
      key={loginCodeEnabled ? 'with-login-code' : 'without-login-code'}
      className={className}
      onSubmitLoginWithCredentials={async (email, password, totpToken) => {
        setTotpRedirectToPassword(false);
        const loginResult = await loginWithCredentials({
          variables: { email, password, totpToken },
        });

        if (loginResult.data?.createSession && afterLoginCallback) {
          afterLoginCallback();
        }
      }}
      loginWithCredentials={withCredentials}
      loginWithCode={withCode}
      codeChallengeRequired={codeChallengeRequired}
      onSubmitLoginWithCode={
        loginCodeEnabled ?
          async (code, totpToken) => {
            const result = await loginWithCode({
              variables: { code, totpToken },
            }).catch(() => null);

            if (
              result?.data?.createSessionWithLoginCode &&
              afterLoginCallback
            ) {
              afterLoginCallback();
            }
          }
        : undefined
      }
      onSubmitLoginWithEmail={handleSubmitLoginWithEmail}
      loginWithEmail={withEmail}
      loginLinkCooldownSeconds={loginLinkCooldownSeconds}
      defaults={
        loginCodeEnabled ? defaults : (
          { ...defaults, useLoginCode: false, loginCode: undefined }
        )
      }
      disablePasswordLogin={disablePasswordLogin}
      otpRequired={otpRequired}
      onEmailChange={handleEmailChange}
      totpRedirectToPassword={totpRedirectToPassword}
    />
  );
}
