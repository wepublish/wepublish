import {
  useLoginWithCredentialsMutation,
  useLoginWithEmailMutation,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderLoginFormProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useUser } from '../session.context';

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

  return (
    <LoginForm
      className={className}
      onSubmitLoginWithCredentials={async (email, password) => {
        const loginResult = await loginWithCredentials({
          variables: { email, password },
        });

        if (loginResult.data?.createSession && afterLoginCallback) {
          afterLoginCallback();
        }
      }}
      loginWithCredentials={withCredentials}
      onSubmitLoginWithEmail={email => {
        loginWithEmail({
          variables: { email },
        });
      }}
      loginWithEmail={withEmail}
      defaults={defaults}
      disablePasswordLogin={disablePasswordLogin}
    />
  );
}
