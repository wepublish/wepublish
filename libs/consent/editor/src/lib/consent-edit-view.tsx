import { useMutation } from '@apollo/client/react';
import { ConsentDocument, UpdateConsentDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { useParams } from 'react-router-dom';

import { consentView } from './consent.view';

type ConsentEditFormProps = {
  consentId: string;
};

export const ConsentEditForm = ({ consentId }: ConsentEditFormProps) => {
  const load = useQueryLoader(
    ConsentDocument,
    { id: consentId },
    data => data.consent
  );
  const [updateConsent] = useMutation(UpdateConsentDocument);
  const consent = useEditForm(consentView, {
    title: 'consents.titleEdit',
    load,
    save: values => updateConsent({ variables: { id: consentId, ...values } }),
  });

  return <FormPage controller={consent} />;
};

export const ConsentEditView = () => {
  const { id } = useParams();

  return (
    <ConsentEditForm
      key={id}
      consentId={id!}
    />
  );
};
