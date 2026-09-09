import { useUser } from '@wepublish/authentication/website';
import { useEffect, useState } from 'react';

const LOGIN_URL = '/login';

export const useLoginLinkSwap = () => {
  const { hasUser, logout } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const matchesLoginUrl = (url: string | undefined | null) => url === LOGIN_URL;

  return { hasUser, logout, mounted, matchesLoginUrl };
};
