import { useMutation, useQuery } from '@apollo/client/react';
import {
  FullUserConsentFragment,
  MutationUpdateUserConsentArgs,
  UpdateUserConsentDocument,
  UserConsentDocument,
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
import { UserConsentForm } from './user-consent-form';

const mapApiDataToInput = (
  userConsent: FullUserConsentFragment
): MutationUpdateUserConsentArgs => ({
  ...userConsent,
  value: userConsent.value,
});

const onErrorToast = (error: Error, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    enqueueSnackbar(
      `A user consent with slug '${slug}' already exists. Please choose a different slug.`,
      { variant: 'error', autoHideDuration: 8000 }
    );
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

  const closePath = '/userConsents';
  const [userConsent, setUserConsent] = useState({
    value: false,
  } as MutationUpdateUserConsentArgs);

  const [shouldClose, setShouldClose] = useState<boolean>(false);

  const {
    loading: dataLoading,
    data: userConsentData,
    error: userConsentError,
  } = useQuery(UserConsentDocument, {
    variables: {
      id: userConsentId,
    },
  });

  useEffect(() => {
    if (userConsentError) {
      onErrorToast(userConsentError);
    }
  }, [userConsentError]);

  useEffect(() => {
    if (userConsentData?.userConsent) {
      setUserConsent(mapApiDataToInput(userConsentData.userConsent));
    }
  }, [userConsentData]);

  const [updateUserConsent, { loading: updateLoading }] = useMutation(
    UpdateUserConsentDocument,
    {
      onError: error => onErrorToast(error, 'userConsent.consent.slug'),
      onCompleted: data => {
        enqueueSnackbar(t('toast.updatedSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
        if (shouldClose) {
          navigate(closePath);
        }
        if (data.updateUserConsent) {
          setUserConsent(mapApiDataToInput(data.updateUserConsent));
        }
      },
    }
  );

  const onSubmit = () => {
    updateUserConsent({
      variables: {
        id: userConsentId,
        value: userConsent.value,
      },
    });
  };

  const loading = dataLoading || updateLoading;

  const { BooleanType } = Schema.Types;
  const validationModel = Schema.Model({
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
        title={t('userConsents.titleEdit')}
        loadingTitle={t('userConsents.titleEdit')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <UserConsentForm
        userConsent={userConsent}
        isEdit
        onChange={changes =>
          setUserConsent(oldConsent => ({ ...oldConsent, ...(changes as any) }))
        }
      />
    </Form>
  );
};
