import { SubscribeBlockContext } from '@wepublish/block-content/website';
import { ComponentProps, ComponentType } from 'react';
import { action } from '@storybook/addon-actions';
import {
  RegisterMutationResult,
  SubscribeMutationResult,
} from '@wepublish/website/api';

type SubscribeDecoratorProps = Partial<
  Pick<
    ComponentProps<typeof SubscribeBlockContext.Provider>['value'],
    | 'userSubscriptions'
    | 'userInvoices'
    | 'challenge'
    | 'redirectPages'
    | 'stripeClientSecret'
  > & {
    subscribeResult: Pick<SubscribeMutationResult, 'data' | 'error'>;
    registerResult: Pick<RegisterMutationResult, 'data' | 'error'>;
  }
>;

export const WithSubscribeBlockDecorators =
  ({
    subscribeResult = { data: undefined },
    registerResult = { data: undefined },
    redirectPages,
    stripeClientSecret,
    challenge = { data: undefined, loading: true },
    userInvoices = { data: undefined, loading: true },
    userSubscriptions = { data: undefined, loading: true },
  }: SubscribeDecoratorProps) =>
  (Story: ComponentType) => {
    const subscribe = async (...args: any[]): Promise<any> => {
      action('subscribe')(args);

      return subscribeResult || {};
    };

    const register = async (...args: any[]): Promise<any> => {
      action('register')(args);

      return registerResult || {};
    };

    return (
      <SubscribeBlockContext.Provider
        value={{
          subscribe,
          register: [register, registerResult as any],
          redirectPages,
          stripeClientSecret,
          challenge,
          userInvoices,
          userSubscriptions,
        }}
      >
        <Story />
      </SubscribeBlockContext.Provider>
    );
  };
