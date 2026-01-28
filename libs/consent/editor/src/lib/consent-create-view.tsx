import { ApolloError } from '@apollo/client';
import {
  MutationCreateConsentArgs,
  useCreateConsentMutation,
} from '@wepublish/editor/api-v2';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { getApiClientV2 } from '@wepublish/editor/api-v2';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { ConsentForm } from './consent-form';

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

export const ConsentCreateView = () => {
  const client = useMemo(() => getApiClientV2(), []);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/consents';
  const [consent, setConsent] = useState({
    name: '',
    slug: '',
    defaultValue: true,
  } as MutationCreateConsentArgs);

  const [shouldClose, setShouldClose] = useState(false);

  const [createConsent, { loading }] = useCreateConsentMutation({
    client,
    onError: error => onErrorToast(error, consent.slug),
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
