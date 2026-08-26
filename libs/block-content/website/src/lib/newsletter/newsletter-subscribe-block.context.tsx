import { FetchResult, MutationFunctionOptions } from '@apollo/client';
import {
  SubscribeToNewsletterMutation,
  SubscribeToNewsletterMutationVariables,
} from '@wepublish/website/api';
import { BuilderSubscribeProps } from '@wepublish/website/builder';
import { createContext, useContext } from 'react';

export type NewsletterSubscribeBlockContextProps = Partial<{
  challenge: BuilderSubscribeProps['challenge'];
  subscribe: (
    options: MutationFunctionOptions<
      SubscribeToNewsletterMutation,
      SubscribeToNewsletterMutationVariables
    >
  ) => Promise<FetchResult<SubscribeToNewsletterMutation>>;
  loading: boolean;
  error?: Error;
}>;

export const NewsletterSubscribeBlockContext =
  createContext<NewsletterSubscribeBlockContextProps>({});

export const useNewsletterSubscribeBlock = () => {
  const { challenge, subscribe, loading, error } = useContext(
    NewsletterSubscribeBlockContext
  );

  if (!subscribe || !challenge) {
    throw new Error(
      'NewsletterSubscribeBlockContext has not been fully provided.'
    );
  }

  return { challenge, subscribe, loading: !!loading, error };
};
