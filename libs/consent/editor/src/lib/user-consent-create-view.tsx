import { useMutation } from '@apollo/client/react';
import {
  CreateUserConsentDocument,
  MutationCreateUserConsentArgs,
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
import { UserConsentForm } from './user-consent-form';

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

export const UserConsentCreateView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/userConsents';
  const [userConsent, setUserConsent] = useState({
    consentId: '',
    userId: '',
    value: true,
  } as MutationCreateUserConsentArgs);

  const [shouldClose, setShouldClose] = useState(false);

  const [createUserConsent, { loading }] = useMutation(
    CreateUserConsentDocument,
    {
      onError: error => onErrorToast(error, userConsent.userId),
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

  const onSubmit = () => {
    createUserConsent({
      variables: userConsent,
    });
  };

  const { StringType, BooleanType } = Schema.Types;
  const validationModel = Schema.Model({
    userId: StringType().isRequired(),
    consentId: StringType().isRequired(),
    value: BooleanType().isRequired(),
  });

  return (
    <Form
      fluid
      formValue={userConsent}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
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

      <UserConsentForm
        userConsent={userConsent}
        onChange={changes =>
          setUserConsent(oldConsent => ({ ...oldConsent, ...(changes as any) }))
        }
      />
    </Form>
  );
};
