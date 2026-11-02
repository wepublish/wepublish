import { useMutation } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { UpdatePasswordDocument } from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useCallback } from 'react';

import { PasswordForm, PasswordFormProps } from './password-form';

export type PasswordFormContainerProps = BuilderContainerProps &
  Pick<PasswordFormProps, 'schema'>;

/** The password form for the signed-in reader. */
export function PasswordFormContainer({
  className,
  schema,
}: PasswordFormContainerProps) {
  const { user } = useUser();
  const [updatePassword] = useMutation(UpdatePasswordDocument);

  const handleUpdate = useCallback<PasswordFormProps['onUpdate']>(
    async variables => {
      await updatePassword({ variables });
    },
    [updatePassword]
  );

  if (!user) {
    return null;
  }

  return (
    <PasswordForm
      className={className}
      schema={schema}
      onUpdate={handleUpdate}
    />
  );
}
