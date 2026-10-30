import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGiftCodeOfferDocument } from '@wepublish/editor/api';
import { CanUpdateGiftCodes } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  createGiftCodeOfferSchema,
  EMPTY_GIFT_CODE_OFFER,
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

const GiftCodeOfferCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const schema = useMemo(() => createGiftCodeOfferSchema(t), [t]);

  const form = useForm<GiftCodeOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_GIFT_CODE_OFFER,
  });

  const [createOffer, { loading }] = useMutation(CreateGiftCodeOfferDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createGiftCodeOffer) {
        navigate(
          shouldClose ? closePath : `./../edit/${data.createGiftCodeOffer.id}`
        );
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(values => {
          const variables = toGiftCodeOfferVariables(values);

          if (variables) {
            createOffer({ variables });
          }
        })}
      >
        <SingleViewTitle
          loading={loading}
          title={t('giftCodeOffer.form.createTitle')}
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
])(GiftCodeOfferCreateView);
export { CheckedPermissionComponent as GiftCodeOfferCreateView };
