import { useMutation } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import {
  EnableTotpDocument,
  GenerateTotpSetupDocument,
} from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useCallback } from 'react';
import { TotpSetup, TotpSetupProps } from './totp-setup';

export type TotpSetupContainerProps = BuilderContainerProps &
  Pick<TotpSetupProps, 'titleComponent'>;

export function TotpSetupContainer({
  className,
  titleComponent,
}: TotpSetupContainerProps) {
  const { user } = useUser();
  const [generateTotpSetup] = useMutation(GenerateTotpSetupDocument);
  const [enableTotp] = useMutation(EnableTotpDocument);

  const handleSetup = useCallback(async () => {
    // website: true is hardcoded in the GraphQL operation
    // so the authenticator app shows the site name (e.g. "Bajour")
    // instead of "We.Publish CMS - Bajour"
    const result = await generateTotpSetup();
    if (result.data?.generateTotpSetup) {
      return {
        uri: result.data.generateTotpSetup.uri,
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
      titleComponent={titleComponent}
      totpEnabled={user.totpEnabled}
      onSetup={handleSetup}
      onEnable={handleEnable}
    />
  );
}
