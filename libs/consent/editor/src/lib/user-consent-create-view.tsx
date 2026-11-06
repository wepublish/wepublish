import { useMutation } from '@apollo/client/react';
import { CreateUserConsentDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';

import { useConsentOptions } from './use-consent-options';
import { toCreateUserConsentVariables } from './user-consent.schema';
import { userConsentView } from './user-consent.view';

export const UserConsentCreateView = () => {
  const consentProps = useConsentOptions();
  const [createUserConsent] = useMutation(CreateUserConsentDocument);
  const userConsent = useCreateForm(userConsentView, {
    title: 'userConsents.titleCreate',
    fields: { consent: { props: consentProps } },
    save: async values => {
      const { data } = await createUserConsent({
        variables: toCreateUserConsentVariables(values),
      });

      return data?.createUserConsent.id;
    },
  });

  return <FormPage controller={userConsent} />;
};
