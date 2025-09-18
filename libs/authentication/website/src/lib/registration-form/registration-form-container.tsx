import { useChallengeQuery, useRegisterMutation } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useUser } from '../session.context';

export type RegistrationFormContainerProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<
    BuilderUserFormFields,
    'flair'
  >,
> = BuilderContainerProps &
  Pick<BuilderRegistrationFormProps<T>, 'fields' | 'schema'>;

export function RegistrationFormContainer<
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({ className, fields, schema }: RegistrationFormContainerProps<T>) {
  const { RegistrationForm } = useWebsiteBuilder();
  const { setToken } = useUser();
  const [register, registerData] = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      setToken({
        createdAt: data.registerMember.session.createdAt,
        expiresAt: data.registerMember.session.expiresAt,
        token: data.registerMember.session.token,
      });
    },
  });
  const challenge = useChallengeQuery();

  return (
    <RegistrationForm
      className={className}
      challenge={challenge}
      register={registerData}
      onRegister={variables =>
        register({
          variables,
        })
      }
      fields={fields}
      schema={schema}
    />
  );
}
