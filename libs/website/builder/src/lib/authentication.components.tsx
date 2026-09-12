import {
  BuilderLoginFormProps,
  BuilderRegistrationFormProps,
} from './authentication.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const LoginForm = (props: BuilderLoginFormProps) => {
  const { LoginForm } = useWebsiteBuilder();

  return <LoginForm {...props} />;
};

export const RegistrationForm = (props: BuilderRegistrationFormProps) => {
  const { RegistrationForm } = useWebsiteBuilder();

  return <RegistrationForm {...props} />;
};
