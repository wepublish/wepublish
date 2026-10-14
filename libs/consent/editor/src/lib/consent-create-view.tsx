import { useMutation } from '@apollo/client/react';
import {
  CreateConsentDocument,
  MutationCreateConsentArgs,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TFunction } from 'i18next';
import { Form, Message, Schema, toaster } from 'rsuite';

import { humanizeError, SingleViewTitle } from '@wepublish/ui/editor';
import { ConsentForm } from './consent-form';

const onErrorToast = (t: TFunction, error: Error, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {t('consents.uniqueConstraint', { slug })}
      </Message>
    );
    return;
  }
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
    </Message>
  );
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
    onError: error => onErrorToast(t, error, consent.slug),
    onCompleted: consent => {
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('toast.createdSuccess')}
        </Message>
      );
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
    name: StringType().isRequired(t('errorMessages.required')),
    slug: StringType().isRequired(t('errorMessages.required')),
    defaultValue: BooleanType().isRequired(t('errorMessages.required')),
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
