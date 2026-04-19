import {
  useCheckLoginOtpLazyQuery,
  useLoginWithCredentialsMutation,
  useLoginWithEmailMutation,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderLoginFormProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../session.context';

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
  const [checkLoginOtp] = useCheckLoginOtpLazyQuery();
  const [loginWithEmail, withEmail] = useLoginWithEmailMutation();
  const [loginWithCredentials, withCredentials] =
    useLoginWithCredentialsMutation({
      onCompleted(data) {
        setToken({
          createdAt: data.createSession.createdAt,
          expiresAt: data.createSession.expiresAt,
          token: data.createSession.token,
        });
      },
    });

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
    async (email: string) => {
      // Check if user has 2FA before sending login link
      const result = await checkLoginOtp({ variables: { email } });
      const needsOtp = result.data?.checkLoginOtp ?? false;

      if (needsOtp) {
        // User has 2FA (or doesn't exist) - redirect to password mode
        setOtpRequired(true);
        setTotpRedirectToPassword(true);
        return;
      }

      // No 2FA - send login link normally
      loginWithEmail({ variables: { email } });
    },
    [checkLoginOtp, loginWithEmail]
  );

  return (
    <LoginForm
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
      onSubmitLoginWithEmail={handleSubmitLoginWithEmail}
      loginWithEmail={withEmail}
      defaults={defaults}
      disablePasswordLogin={disablePasswordLogin}
      otpRequired={otpRequired}
      onEmailChange={handleEmailChange}
      totpRedirectToPassword={totpRedirectToPassword}
    />
  );
}
