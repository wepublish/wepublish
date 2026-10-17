import { useQuery } from '@apollo/client/react';
import {
  CurrentSessionDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import { useUser } from './session.context';

/**
 * Logged in with a personal login code, but the account isn't set up yet
 * (email address unconfirmed). Account pages aren't usable then, so navbars
 * should lead to the setup instead. Only on media with login codes switched
 * on; custom navbars can use this the same way as the shared one.
 */
export const useAccountSetupPending = (): boolean => {
  const { hasUser } = useUser();
  const { data: sessionData } = useQuery(CurrentSessionDocument, {
    skip: !hasUser,
    fetchPolicy: 'cache-first',
  });
  const { data: settingsData } = useQuery(SettingListDocument, {
    skip: !hasUser,
  });

  const loginCodeEnabled =
    settingsData?.settings.find(
      setting => setting.name === SettingName.LoginCodeEnabled
    )?.value === true;

  return (
    hasUser && loginCodeEnabled && !!sessionData?.currentSession.restricted
  );
};
