import { useMutation } from '@apollo/client/react';
import { useRegister } from '@wepublish/authentication/website';
import { RedeemGiftCodeDocument } from '@wepublish/website/api';
import {
  BuilderGiftCodeRedeemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type GiftCodeRedeemContainerProps = Pick<
  BuilderGiftCodeRedeemProps,
  'fields' | 'schema' | 'className'
>;

export const GiftCodeRedeemContainer = (
  props: GiftCodeRedeemContainerProps
) => {
  const { GiftCodeRedeem } = useWebsiteBuilder();
  const {
    register: [register],
    challenge,
  } = useRegister();
  const [redeem, { data }] = useMutation(RedeemGiftCodeDocument);

  const redeemCode = async (code: string) => {
    const { error } = await redeem({ variables: { code } });

    if (error) {
      throw error;
    }
  };

  return (
    <GiftCodeRedeem
      {...props}
      challenge={challenge}
      redemption={data?.redeemGiftCode}
      onRedeem={redeemCode}
      onRedeemWithRegister={async ({ code, register: variables }) => {
        const { error } = await register({ variables });

        if (error) {
          throw error;
        }

        await redeemCode(code);
      }}
    />
  );
};
