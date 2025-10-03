import {
  BuilderContainerProps,
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRegister } from '../use-register';

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
  const {
    register: [register, registerData],
    challenge,
  } = useRegister();

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
