import { useRegister } from '@wepublish/authentication/website';
import { PaymentForm, usePurchaseGiftCode } from '@wepublish/payment/website';
import {
  BuilderGiftCodePurchaseProps,
  BuilderGiftCodePurchaseVariables,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type GiftCodePurchaseContainerProps = Pick<
  BuilderGiftCodePurchaseProps,
  | 'offers'
  | 'defaultOfferId'
  | 'fields'
  | 'schema'
  | 'askRecipientName'
  | 'showDiscountCodes'
  | 'className'
>;

export const GiftCodePurchaseContainer = (
  props: GiftCodePurchaseContainerProps
) => {
  const { GiftCodePurchase } = useWebsiteBuilder();
  const {
    register: [register],
    challenge,
  } = useRegister();
  const [purchase, redirectPages, stripeClientSecret] = usePurchaseGiftCode();

  const purchaseGiftCode = async (
    variables: BuilderGiftCodePurchaseVariables
  ) => {
    const { error } = await purchase({ variables });

    if (error) {
      throw error;
    }
  };

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      <GiftCodePurchase
        {...props}
        challenge={challenge}
        onPurchase={purchaseGiftCode}
        onPurchaseWithRegister={async ({
          purchase: purchaseVariables,
          register: variables,
        }) => {
          const { error } = await register({ variables });

          if (error) {
            throw error;
          }

          await purchaseGiftCode(purchaseVariables);
        }}
      />
    </>
  );
};
