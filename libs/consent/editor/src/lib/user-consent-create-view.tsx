import { useMutation } from '@apollo/client/react';
import { CreateUserConsentDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  humanizeError,
  SingleViewTitle,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import {
  UserConsentForm,
  UserConsentFormValues,
  userConsentSchema,
} from './user-consent-form';
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

export const UserConsentCreateView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/userConsents';
  const form = useForm<UserConsentFormValues>({
    resolver: zodResolver(userConsentSchema),
    defaultValues: { consentId: '', userId: '', value: true },
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [createUserConsent, { loading }] = useMutation(
    CreateUserConsentDocument,
    {
      onError: error => onErrorToast(t, error, form.getValues('userId')),
      onCompleted: consent => {
        enqueueSnackbar(t('toast.createdSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
        if (shouldClose) {
          navigate(closePath);
        } else {
          navigate(`/userConsents/edit/${consent.createUserConsent?.id}`);
        }
      },
    }
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ id, ...userConsent }) =>
          createUserConsent({ variables: userConsent })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('userConsents.titleCreate')}
          loadingTitle={t('userConsents.titleCreate')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <UserConsentForm />
      </form>
    </FormProvider>
  );
};
