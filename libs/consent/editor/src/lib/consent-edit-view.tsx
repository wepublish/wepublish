import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ConsentDocument,
  FullConsentFragment,
  UpdateConsentDocument,
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

import { ConsentForm, ConsentFormValues, consentSchema } from './consent-form';

const mapApiDataToInput = (
  consent: FullConsentFragment
): ConsentFormValues => ({
  id: consent.id,
  name: consent.name,
  slug: consent.slug,
  defaultValue: consent.defaultValue,
});

export const ConsentEditView = () => {
  const { id } = useParams();
  const consentId = id!;

  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();

  const onErrorToast = (error: Error, slug?: string) => {
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

  const closePath = '/consents';
  const [shouldClose, setShouldClose] = useState<boolean>(false);

  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: ConsentDocument,
        variables: { id: consentId },
      });

      return mapApiDataToInput(data!.consent);
    },
  });

  const [updateConsent, { loading: updateLoading }] = useMutation(
    UpdateConsentDocument,
    {
      onError: error => onErrorToast(error, form.getValues('slug')),
      onCompleted: data => {
        if (shouldClose) {
          navigate(closePath);
        }

        if (data.updateConsent) {
          form.reset(mapApiDataToInput(data.updateConsent));
        }

        enqueueSnackbar(t('toast.updatedSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ name, slug, defaultValue }) =>
          updateConsent({
            variables: { id: consentId, name, slug, defaultValue },
          })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('consents.titleEdit')}
          loadingTitle={t('consents.titleEdit')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <ConsentForm />
      </form>
    </FormProvider>
  );
};
