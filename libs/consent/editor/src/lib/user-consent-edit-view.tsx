import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import {
  FullUserConsentFragment,
  UpdateUserConsentDocument,
  UserConsentDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  UserConsentForm,
  UserConsentFormValues,
  userConsentSchema,
} from './user-consent-form';

const mapApiDataToInput = (
  userConsent: FullUserConsentFragment
): UserConsentFormValues => ({
  id: userConsent.id,
  userId: userConsent.user.id,
  consentId: userConsent.consent.id,
  value: userConsent.value,
});

const onErrorToast = (t: TFunction, error: Error, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    enqueueSnackbar(t('userConsents.uniqueConstraint', { slug }), {
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

export const UserConsentEditView = () => {
  const { id } = useParams();
  const userConsentId = id!;

  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();

  const closePath = '/userConsents';
  const [shouldClose, setShouldClose] = useState<boolean>(false);

  const form = useForm<UserConsentFormValues>({
    resolver: zodResolver(userConsentSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: UserConsentDocument,
        variables: { id: userConsentId },
      });

      return mapApiDataToInput(data!.userConsent);
    },
  });

  const [updateUserConsent, { loading: updateLoading }] = useMutation(
    UpdateUserConsentDocument,
    {
      onError: error => onErrorToast(t, error, 'userConsent.consent.slug'),
      onCompleted: data => {
        enqueueSnackbar(t('toast.updatedSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
        if (shouldClose) {
          navigate(closePath);
        }
        if (data.updateUserConsent) {
          form.reset(mapApiDataToInput(data.updateUserConsent));
        }
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ value }) =>
          updateUserConsent({ variables: { id: userConsentId, value } })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('userConsents.titleEdit')}
          loadingTitle={t('userConsents.titleEdit')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <UserConsentForm isEdit />
      </form>
    </FormProvider>
  );
};
