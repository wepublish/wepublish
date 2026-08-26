import {
  useChallengeQuery,
  useSubscribeToNewsletterMutation,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { NewsletterSubscribeBlockContext } from './newsletter-subscribe-block.context';

export function NewsletterSubscribeBlockProvider({
  children,
}: PropsWithChildren) {
  const challenge = useChallengeQuery({
    fetchPolicy: 'cache-first',
  });
  const [subscribe, { loading, error }] = useSubscribeToNewsletterMutation();

  return (
    <NewsletterSubscribeBlockContext.Provider
      value={{
        challenge,
        subscribe,
        loading,
        error,
      }}
    >
      {children}
    </NewsletterSubscribeBlockContext.Provider>
  );
}
