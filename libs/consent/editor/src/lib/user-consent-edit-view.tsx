import { useMutation } from '@apollo/client/react';
import {
  UpdateUserConsentDocument,
  UserConsentDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { useParams } from 'react-router-dom';

import { useConsentOptions } from './use-consent-options';
import { fromUserConsent } from './user-consent.schema';
import { userConsentView } from './user-consent.view';

type UserConsentEditFormProps = {
  userConsentId: string;
};

export const UserConsentEditForm = ({
  userConsentId,
}: UserConsentEditFormProps) => {
  const consentProps = useConsentOptions();
  const load = useQueryLoader(
    UserConsentDocument,
    { id: userConsentId },
    data => fromUserConsent(data.userConsent)
  );
  const [updateUserConsent] = useMutation(UpdateUserConsentDocument);
  const userConsent = useEditForm(userConsentView, {
    title: 'userConsents.titleEdit',
    load,
    fields: {
      user: { readOnly: true },
      consent: { readOnly: true, props: consentProps },
    },
    save: ({ value }) =>
      updateUserConsent({ variables: { id: userConsentId, value } }),
  });

  return <FormPage controller={userConsent} />;
};

export const UserConsentEditView = () => {
  const { id } = useParams();

  return (
    <UserConsentEditForm
      key={id}
      userConsentId={id!}
    />
  );
};
