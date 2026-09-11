import { Alert, NoSsr } from '@mui/material';
import { ErrorCode } from '@wepublish/errors';
import {
  BuilderApiAlertProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

enum ErrorMessage {
  EmailAlreadyInUse = 'Email already in use',
}

export function translateApolloErrorMessage(
  errorMessage: string
): string | undefined {
  switch (errorMessage) {
    case ErrorMessage.EmailAlreadyInUse:
      return 'Es besteht bereits ein Konto mit dieser E-mail.';
    case ErrorCode.PaymentAlreadyRunning:
      return 'Es läuft bereits eine Zahlung für diese Rechnung. Bitte warte mindestens eine Minute, bevor du es erneut versuchst.';
  }

  return errorMessage;
}

export function ApiAlert({ error, ...props }: BuilderApiAlertProps) {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  const loginLink =
    typeof window !== 'undefined' ?
      `/login?intended=${window.location.pathname}${window.location.search}`
    : `/login`;

  return (
    <NoSsr>
      <Alert {...props}>
        {translateApolloErrorMessage(error.message)}

        {error.message === ErrorMessage.EmailAlreadyInUse && (
          <>
            {' '}
            <Link href={loginLink}>{'Bitte einloggen'}</Link>
          </>
        )}
      </Alert>
    </NoSsr>
  );
}
