import { useMutation } from '@apollo/client/react';
import {
  CreateConsentDocument,
  MutationCreateConsentArgs,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Schema } from 'rsuite';

import {
  humanizeError,
  SingleViewTitle,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { ConsentForm } from './consent-form';

const onErrorToast = (error: Error, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    enqueueSnackbar(
      `A consent with slug '${slug}' already exists. Please choose a different slug.`,
      { variant: 'error', autoHideDuration: 8000 }
    );
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
  const [consent, setConsent] = useState({
    name: '',
    slug: '',
    defaultValue: true,
  } as MutationCreateConsentArgs);

  const [shouldClose, setShouldClose] = useState(false);

  const [createConsent, { loading }] = useMutation(CreateConsentDocument, {
    onError: error => onErrorToast(error, consent.slug),
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

  const onSubmit = () => {
    createConsent({
      variables: consent,
    });
  };

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
        title={t('consents.titleCreate')}
        loadingTitle={t('consents.titleCreate')}
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
