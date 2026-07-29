import { ApolloError } from '@apollo/client';
import { useUserListQuery } from '@wepublish/editor/api';
import {
  MutationCreateUserConsentArgs,
  MutationUpdateUserConsentArgs,
  useConsentsQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  Form,
  Loader,
  Message,
  Panel,
  SelectPicker,
  toaster,
} from 'rsuite';

type UserConsentFormData = Partial<
  MutationCreateUserConsentArgs & MutationUpdateUserConsentArgs
>;

type UserConsentFormProps = {
  isEdit?: boolean;
  userConsent: UserConsentFormData;
  onChange: (changes: Partial<UserConsentFormData>) => void;
};

const onErrorToast = (error: ApolloError) => {
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

export const UserConsentForm = ({
  userConsent,
  onChange,
  isEdit,
}: UserConsentFormProps) => {
  const { t } = useTranslation();

  const consentValues = [
    {
      value: true,
      label: 'Accepted',
    },
    {
      value: false,
      label: 'Rejected',
    },
  ];

  const { loading: loadingUsers, data: userData } = useUserListQuery({
    variables: {
      take: 100,
    },
  });

  const { loading: loadingConsents, data: consentsData } = useConsentsQuery({
    onError: onErrorToast,
  });

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
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
    >
      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <Form.Group controlId="name">
          <Form.Label>{t('dashboard.user')}</Form.Label>
          <SelectPicker
            key="userId"
            placeholder={t('dashboard.user')}
            block
            disabled={isEdit}
            data={userValues || []}
            value={
              userData?.users.nodes.find(c => c.id === userConsent.userId)?.id
            }
            onChange={value =>
              onChange({
                userId: userValues.find(v => v.value === value)?.value,
              })
            }
          />
        </Form.Group>

        <Form.Group controlId="slug">
          <Form.Label>{t('consents.consent')}</Form.Label>
          <SelectPicker
            key="consentId"
            placeholder={t('consents.consent')}
            block
            disabled={isEdit}
            data={consentsValues || []}
            value={
              consentsData?.consents.find(c => c.id === userConsent.userId)?.id
            }
            onChange={value =>
              onChange({
                consentId: consentsValues.find(v => v.value === value)?.value,
              })
            }
          />
        </Form.Group>

        <Form.Group controlId="value">
          <Form.Label>{t('userConsents.value')}</Form.Label>
          <Checkbox
            checked={userConsent.value}
            onChange={(_, checked) => {
              onChange({ value: checked });
            }}
          >
            {consentValues.find(v => v.value === userConsent.value)?.label}
          </Checkbox>
        </Form.Group>
      </Panel>
    </div>
  );
};
