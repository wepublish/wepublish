import { useMutation } from '@apollo/client/react';
import {
  GiftCodeOfferDocument,
  UpdateGiftCodeOfferDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanUpdateGiftCodes } from '@wepublish/permissions';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import {
  fromGiftCodeOffer,
  giftCodeOfferTitleParams,
  toGiftCodeOfferVariables,
} from './giftCodeOffer.schema';
import { giftCodeOfferView } from './giftCodeOffer.view';

type GiftCodeOfferEditFormProps = {
  id: string;
};

const GiftCodeOfferEditForm = ({ id }: GiftCodeOfferEditFormProps) => {
  const load = useQueryLoader(GiftCodeOfferDocument, { id }, data =>
    fromGiftCodeOffer(data.giftCodeOffer)
  );
  const [updateOffer] = useMutation(UpdateGiftCodeOfferDocument);
  const offer = useEditForm(giftCodeOfferView, {
    title: 'giftCodeOffer.form.editTitle',
    titleParams: giftCodeOfferTitleParams,
    load,
    save: values =>
      updateOffer({ variables: { id, ...toGiftCodeOfferVariables(values) } }),
  });

  return <FormPage controller={offer} />;
};

const GiftCodeOfferEditView = () => {
  const { id = '' } = useParams();

  return (
    <GiftCodeOfferEditForm
      key={id}
      id={id}
    />
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGiftCodes.id,
])(GiftCodeOfferEditView);
export { CheckedPermissionComponent as GiftCodeOfferEditView };
