import { useMutation } from '@apollo/client/react';
import { CreateConsentDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';

import { consentView } from './consent.view';

export const ConsentCreateView = () => {
  const [createConsent] = useMutation(CreateConsentDocument);
  const consent = useCreateForm(consentView, {
    title: 'consents.titleCreate',
    save: async values => {
      const { data } = await createConsent({ variables: values });

      return data?.createConsent.id;
    },
  });

  return <FormPage controller={consent} />;
};
