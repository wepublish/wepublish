import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  ConsentsDocument,
  MutationCreateUserConsentArgs,
  MutationUpdateUserConsentArgs,
  UserListDocument,
} from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Loader,
  Message,
  Panel,
  SelectPicker,
  toaster,
  Toggle,
} from 'rsuite';

type UserConsentFormData = Partial<
  MutationCreateUserConsentArgs & MutationUpdateUserConsentArgs
>;

type UserConsentFormProps = {
  isEdit?: boolean;
  userConsent: UserConsentFormData;
  onChange: (changes: Partial<UserConsentFormData>) => void;
};

const FormCard = styled(Panel)`
  width: 100%;
  max-width: 640px;
  overflow: initial;
`;

const Fields = styled.div`
  display: grid;
  gap: 20px;

  .rs-form-group {
    margin-bottom: 0;
  }
`;

const onErrorToast = (error: Error) => {
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

export const UserConsentForm = ({
  userConsent,
  onChange,
  isEdit,
}: UserConsentFormProps) => {
  const { t } = useTranslation();

  const { loading: loadingUsers, data: userData } = useQuery(UserListDocument, {
    variables: {
      take: 100,
    },
  });

  const {
    loading: loadingConsents,
    data: consentsData,
    error: consentsError,
  } = useQuery(ConsentsDocument);

  useEffect(() => {
    if (consentsError) {
      onErrorToast(consentsError);
    }
  }, [consentsError]);

  const consentsValues =
    consentsData?.consents?.map(c => ({
      value: c.id,
      label: c.name,
    })) || [];

  const userValues =
    userData?.users?.nodes?.map(c => ({
      value: c.id,
      label: c.name,
    })) || [];

  if (loadingUsers || loadingConsents) {
    return <Loader />;
  }

  return (
    <FormCard bordered>
      <Fields>
        <Form.Group controlId="userId">
          <Form.Label>{t('dashboard.user')}</Form.Label>
          <SelectPicker
            key="userId"
            placeholder={t('dashboard.user')}
            block
            disabled={isEdit}
            data={userValues}
            value={userConsent.userId ?? null}
            onChange={value => onChange({ userId: value ?? undefined })}
          />
        </Form.Group>

        <Form.Group controlId="consentId">
          <Form.Label>{t('consents.consent')}</Form.Label>
          <SelectPicker
            key="consentId"
            placeholder={t('consents.consent')}
            block
            disabled={isEdit}
            data={consentsValues}
            value={userConsent.consentId ?? null}
            onChange={value => onChange({ consentId: value ?? undefined })}
          />
        </Form.Group>

        <Toggle
          checked={!!userConsent.value}
          label={t('consents.accepted')}
          onChange={value => onChange({ value })}
        />
      </Fields>
    </FormCard>
  );
};
