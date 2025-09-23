import { useUser } from '@wepublish/authentication/website';
import {
  useLoginWithJwtMutation,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { ComponentType, memo } from 'react';

export const withJwtHandler = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const [loginWithJwt] = useLoginWithJwtMutation();
    const { setToken } = useUser();

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const jwt = url.searchParams.get('jwt');

      if (jwt) {
        url.searchParams.delete('jwt');
        window.history.replaceState(null, '', url.toString());

        loginWithJwt({
          variables: {
            jwt,
          },
        }).then(result => {
          if (result?.data?.createSessionWithJWT) {
            setToken(
              result.data.createSessionWithJWT as SessionWithTokenWithoutUser
            );
          }
        });
      }
    }

    return <ControlledComponent {...(props as P)} />;
  });
