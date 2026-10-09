import { useMutation, useQuery } from '@apollo/client/react';
import {
  ConsentDocument,
  FullConsentFragment,
  MutationCreateConsentArgs,
  MutationUpdateConsentArgs,
  UpdateConsentDocument,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Schema } from 'rsuite';

import {
  humanizeError,
  SingleViewTitle,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { ConsentForm } from './consent-form';

const mapApiDataToInput = (
  consent: FullConsentFragment
): MutationUpdateConsentArgs => ({
  ...consent,
  name: consent.name,
  slug: consent.slug,
  defaultValue: consent.defaultValue,
});

export const ConsentEditView = () => {
  const { id } = useParams();
  const consentId = id!;

  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [consent, setConsent] = useState<
    MutationCreateConsentArgs | MutationUpdateConsentArgs
  >({
    defaultValue: true,
    name: '',
    slug: '',
  });

  const [shouldClose, setShouldClose] = useState<boolean>(false);

  const {
    loading: dataLoading,
    data: consentData,
    error: consentError,
  } = useQuery(ConsentDocument, {
    variables: {
      id: consentId,
    },
  });

  useEffect(() => {
    if (consentError) {
      onErrorToast(consentError);
    }
  }, [consentError]);

  useEffect(() => {
    if (consentData?.consent) {
      setConsent(mapApiDataToInput(consentData.consent));
    }
  }, [consentData]);

  const [updateConsent, { loading: updateLoading }] = useMutation(
    UpdateConsentDocument,
    {
      onError: error => onErrorToast(error, consent.slug ?? ''),
      onCompleted: data => {
        if (shouldClose) {
          navigate(closePath);
        }

        if (data.updateConsent) {
          setConsent(mapApiDataToInput(data.updateConsent));
        }

        enqueueSnackbar(t('toast.updatedSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
      },
    }
  );

  const onSubmit = () => {
    updateConsent({
      variables: {
        id: consentId,
        name: consent.name,
        slug: consent.slug,
        defaultValue: consent.defaultValue,
      },
    });
  };

  const loading = dataLoading || updateLoading;

  const { StringType, BooleanType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    slug: StringType().isRequired(),
    defaultValue: BooleanType().isRequired(),
  });

  return (
    <Form
      fluid
      formValue={consent}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('consents.titleEdit')}
        loadingTitle={t('consents.titleEdit')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <ConsentForm
        consent={consent}
        create
        onChange={changes =>
          setConsent(oldConsent => ({ ...oldConsent, ...(changes as any) }))
        }
      />
    </Form>
  );
};
