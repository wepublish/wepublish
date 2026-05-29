import { useUser } from '@wepublish/authentication/website';
import {
  UpdatePasswordMutationVariables,
  UpdateUserMutationVariables,
  useRequestEmailChangeMutation,
  useUpdatePasswordMutation,
  useUpdateUserMutation,
  useUploadImageMutation,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderPersonalDataFormFields,
  BuilderPersonalDataFormProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ChangeEvent, useCallback } from 'react';

export type PersonalDataFormContainerProps<
  T extends BuilderPersonalDataFormFields = BuilderPersonalDataFormFields,
> = BuilderContainerProps &
  Pick<BuilderPersonalDataFormProps<T>, 'fields' | 'schema'>;

export function PersonalDataFormContainer<
  T extends BuilderPersonalDataFormFields,
>({ className, schema, fields }: PersonalDataFormContainerProps<T>) {
  const { PersonalDataForm } = useWebsiteBuilder();
  const { user } = useUser();

  const [uploadImage] = useUploadImageMutation();
  const [updatePassword] = useUpdatePasswordMutation();
  const [updateUser] = useUpdateUserMutation();
  const [requestEmailChange] = useRequestEmailChangeMutation();

  const handleOnImageUpload = useCallback(
    async (input: ChangeEvent<HTMLInputElement> | null) => {
      if (input) {
        await uploadImage({
          variables: {
            file: input.target?.files![0] as File,
            focalPointX: 0.5,
            focalPointY: 0.5,
          },
        });
      }
    },
    [uploadImage]
  );

  const handleOnUpdate = useCallback(
    async (
      variables: UpdateUserMutationVariables &
        Partial<UpdatePasswordMutationVariables>
    ) => {
      const { password, passwordRepeated, ...userInput } = variables;
      const updates = [
        updateUser({
          variables: userInput,
        }),
      ] as Promise<unknown>[];

      if (password && passwordRepeated) {
        updates.push(
          updatePassword({
            variables: {
              password,
              passwordRepeated,
            },
          })
        );
      }

      await Promise.all(updates);
    },
    [updatePassword, updateUser]
  );

  const handleRequestEmailChange = useCallback(
    async (newEmail: string) => {
      await requestEmailChange({ variables: { newEmail } });
    },
    [requestEmailChange]
  );

  if (!user) {
    return null;
  }

  return (
    <PersonalDataForm
      className={className}
      user={user}
      onImageUpload={handleOnImageUpload}
      onUpdate={handleOnUpdate}
      onRequestEmailChange={handleRequestEmailChange}
      fields={fields}
      schema={schema}
    />
  );
}
