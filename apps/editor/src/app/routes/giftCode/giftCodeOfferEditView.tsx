import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FullGiftCodeOfferFragment,
  GiftCodeOfferDocument,
  UpdateGiftCodeOfferDocument,
} from '@wepublish/editor/api';
import { CanUpdateGiftCodes } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createGiftCodeOfferSchema,
  GiftCodeOfferForm,
  GiftCodeOfferFormValues,
  toGiftCodeOfferVariables,
} from './giftCodeOfferForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const mapApiDataToInput = (
  offer: FullGiftCodeOfferFragment
): GiftCodeOfferFormValues => ({
  name: offer.name,
  description: offer.description,
  active: offer.active,
  issueBeforePayment: offer.issueBeforePayment,
  allowDiscountCodes: offer.allowDiscountCodes,
  memberPlanId: offer.memberPlanId,
  memberPlan: offer.memberPlan,
  periodicity: offer.periodicity,
  redemptionWindowMonths: offer.redemptionWindowMonths,
  paymentMethodIds: offer.paymentMethodIds,
  imageID: offer.imageID,
  image: offer.image,
});

const GiftCodeOfferEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const closePath = './../..';
  const client = useApolloClient();

  const schema = useMemo(() => createGiftCodeOfferSchema(t), [t]);

  const form = useForm<GiftCodeOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: GiftCodeOfferDocument,
        variables: { id: id as string },
      });

      return mapApiDataToInput(data!.giftCodeOffer);
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  const [updateOffer, { loading }] = useMutation(UpdateGiftCodeOfferDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.updateGiftCodeOffer) {
        if (shouldClose) {
          navigate(closePath);
        } else {
          form.reset(mapApiDataToInput(data.updateGiftCodeOffer));
        }
      }
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(values => {
          const variables = toGiftCodeOfferVariables(values);

          if (variables) {
            updateOffer({ variables: { ...variables, id: id as string } });
          }
        })}
      >
        <SingleViewTitle
          loading={loading}
          title={t('giftCodeOffer.form.editTitle', { offer: name })}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <GiftCodeOfferForm />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGiftCodes.id,
])(GiftCodeOfferEditView);
export { CheckedPermissionComponent as GiftCodeOfferEditView };
