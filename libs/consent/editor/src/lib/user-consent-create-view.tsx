import { ApolloError } from '@apollo/client';
import {
  MutationCreateUserConsentArgs,
  useCreateUserConsentMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { SingleViewTitle } from '@wepublish/ui/editor';
import { UserConsentForm } from './user-consent-form';

const onErrorToast = (error: ApolloError, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {`A consent with slug '${slug}' already exists. Please choose a different slug.`}
      </Message>
    );
    return;
  }
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
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

  const [createUserConsent, { loading }] = useCreateUserConsentMutation({
    onError: error => onErrorToast(error, userConsent.userId),
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
        navigate(`/userConsents/edit/${consent.createUserConsent?.id}`);
      }
    },
  });

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
