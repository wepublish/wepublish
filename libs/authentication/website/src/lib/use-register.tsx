import { useMutation, useQuery } from '@apollo/client/react';
import { ChallengeDocument, RegisterDocument } from '@wepublish/website/api';
import { useUser } from './session.context';

export const useRegister = () => {
  const { setToken, hasUser } = useUser();

  const challenge = useQuery(ChallengeDocument, {
    skip: hasUser,
  });

  const register = useMutation(RegisterDocument, {
    onError: () => challenge.refetch(),
    onCompleted(data) {
      if (data.registerMember.session) {
        setToken(data.registerMember.session);
      }
    },
  });

  return { register, challenge };
};
