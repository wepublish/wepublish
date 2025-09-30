import styled from '@emotion/styled';
import { Checkbox } from '@mui/material';
import { RegistrationForm } from '@wepublish/authentication/website';
import { RegisterMutationVariables } from '@wepublish/website/api';
import {
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { PropsWithChildren, useCallback, useState } from 'react';
import { DeepPartial } from 'react-hook-form';

export const SubscribeCheckboxWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

export function OnlineReportsRegistrationForm<
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>(props: PropsWithChildren<BuilderRegistrationFormProps<T>>) {
  const { push } = useRouter();
  const [formValues, setFormValues] = useState<
    DeepPartial<RegisterMutationVariables>
  >({});

  const handleSubscribe = useCallback(async () => {
    const { email, firstName, name } = formValues;
    await push({
      pathname: '/mitmachen',
      query: {
        firstName,
        mail: email,
        lastName: name,
      },
    });
  }, [formValues, push]);

  return (
    <RegistrationForm
      {...props}
      onChange={setFormValues}
    >
      <SubscribeCheckboxWrapper>
        <Checkbox onClick={handleSubscribe} />
        <div>Ich möchte den OnlineReports-Recherchierfonds unterstützen.</div>
      </SubscribeCheckboxWrapper>
    </RegistrationForm>
  );
}
