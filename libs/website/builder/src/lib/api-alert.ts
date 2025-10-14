import { ApolloError } from '@apollo/client/errors';
import { AlertProps } from '@wepublish/ui';

export type BuilderApiAlertProps = Omit<AlertProps, 'children'> & {
  error: ApolloError | Error;
};
