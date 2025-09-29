import { useChallengeQuery, useRegisterMutation } from '@wepublish/website/api';
import { useUser } from './session.context';

export const useRegister = () => {
  const { setToken, hasUser } = useUser();

  const challenge = useChallengeQuery({
    skip: hasUser,
  });

  const register = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMember.session) {
        setToken(data.registerMember.session);
      }
    },
  });

  return { register, challenge };
};
