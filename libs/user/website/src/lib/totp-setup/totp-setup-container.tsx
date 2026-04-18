import { useUser } from '@wepublish/authentication/website';
import {
  useEnableTotpMutation,
  useGenerateTotpSetupMutation,
} from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useCallback } from 'react';
import { TotpSetup } from './totp-setup';

export type TotpSetupContainerProps = BuilderContainerProps;

export function TotpSetupContainer({ className }: TotpSetupContainerProps) {
  const { user } = useUser();
  const [generateTotpSetup] = useGenerateTotpSetupMutation();
  const [enableTotp] = useEnableTotpMutation();

  const handleSetup = useCallback(async () => {
    // website: true is hardcoded in the GraphQL operation
    // so the authenticator app shows the site name (e.g. "Bajour")
    // instead of "We.Publish CMS - Bajour"
    const result = await generateTotpSetup();
    if (result.data?.generateTotpSetup) {
      return {
        qrCode: result.data.generateTotpSetup.qrCode,
        secret: result.data.generateTotpSetup.secret,
      };
    }
    return null;
  }, [generateTotpSetup]);

  const handleEnable = useCallback(
    async (totpToken: string) => {
      const result = await enableTotp({ variables: { totpToken } });
      return !!result.data?.enableTotp;
    },
    [enableTotp]
  );

  if (!user) {
    return null;
  }

  return (
    <TotpSetup
      className={className}
      totpEnabled={user.totpEnabled}
      onSetup={handleSetup}
      onEnable={handleEnable}
    />
  );
}
