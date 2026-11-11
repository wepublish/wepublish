import { useMutation } from '@apollo/client/react';
import { CreateConsentDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  humanizeError,
  SingleViewTitle,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { ConsentForm, ConsentFormValues, consentSchema } from './consent-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { FormProvider, useForm } from 'react-hook-form';

const onErrorToast = (t: TFunction, error: Error, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    enqueueSnackbar(t('consents.uniqueConstraint', { slug }), {
      variant: 'error',
      autoHideDuration: 8000,
    });
    return;
  }
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export const ConsentCreateView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/consents';
  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: { name: '', slug: '', defaultValue: true },
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [createConsent, { loading }] = useMutation(CreateConsentDocument, {
    onError: error => onErrorToast(t, error, form.getValues('slug')),
    onCompleted: consent => {
      enqueueSnackbar(t('toast.createdSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/consents/edit/${consent.createConsent?.id}`);
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ id, ...consent }) =>
          createConsent({ variables: consent })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('consents.titleCreate')}
          loadingTitle={t('consents.titleCreate')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <ConsentForm create />
      </form>
    </FormProvider>
  );
};
