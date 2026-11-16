import { useMutation } from '@apollo/client/react';
import { CreateGiftCodeOfferDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { CanUpdateGiftCodes } from '@wepublish/permissions';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';

import { toGiftCodeOfferVariables } from './giftCodeOffer.schema';
import { giftCodeOfferView } from './giftCodeOffer.view';

const GiftCodeOfferCreateView = () => {
  const [createOffer] = useMutation(CreateGiftCodeOfferDocument);
  const offer = useCreateForm(giftCodeOfferView, {
    title: 'giftCodeOffer.form.createTitle',
    save: async values => {
      const { data } = await createOffer({
        variables: toGiftCodeOfferVariables(values),
      });

      return data?.createGiftCodeOffer.id;
    },
  });

  return <FormPage controller={offer} />;
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGiftCodes.id,
])(GiftCodeOfferCreateView);
export { CheckedPermissionComponent as GiftCodeOfferCreateView };
