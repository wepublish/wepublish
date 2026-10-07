import { AlertProps } from '@wepublish/ui';

export type BuilderApiAlertProps = Omit<AlertProps, 'children'> & {
  error: Error | Error;
};
