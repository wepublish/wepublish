import { SubscribeBlockContext } from '@wepublish/block-content/website';
import { ComponentProps, ComponentType } from 'react';
import { action } from '@storybook/addon-actions';
import {
  RegisterMutationResult,
  SubscribeMutationResult,
  UpgradeMutationResult,
  UpgradeSubscriptionInfoQueryResult,
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
    upgradeResult: Pick<UpgradeMutationResult, 'data' | 'error'>;
    upgradeInfoResult: Pick<
      UpgradeSubscriptionInfoQueryResult,
      'data' | 'error'
    >;
  }
>;

export const WithSubscribeBlockDecorators =
  ({
    subscribeResult = { data: undefined },
    registerResult = { data: undefined },
    upgradeResult = { data: undefined },
    upgradeInfoResult = { data: undefined },
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

    const upgrade = async (...args: any[]): Promise<any> => {
      action('upgrade')(args);

      return upgradeResult || {};
    };

    const register = async (...args: any[]): Promise<any> => {
      action('register')(args);

      return registerResult || {};
    };

    const fetchUpgradeInfo = async (...args: any[]): Promise<any> => {
      action('fetchUpgradeInfo')(args);

      return upgradeInfoResult || {};
    };

    return (
      <SubscribeBlockContext.Provider
        value={{
          subscribe,
          upgrade,
          register: [register, registerResult as any],
          upgradeInfo: [fetchUpgradeInfo, upgradeInfoResult as any],
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
